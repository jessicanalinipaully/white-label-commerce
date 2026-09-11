import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CustomerService } from '../customer/customer.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { VerifyPaymentDto } from './dto/payment.dto';
import { OrderStatus, OrderPaymentStatus, PaymentStatus } from '@commerce/types';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
    private readonly razorpayProvider: RazorpayProvider,
  ) {}

  async createPaymentOrder(storeId: string, userId: string, orderId: string): Promise<any> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);

    // Load order matching BOTH tenant and customer ownership
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: customer.id, storeId },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to current customer');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot initiate payment for a cancelled order');
    }

    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new BadRequestException('Order has already been paid');
    }

    // Authoritative server-calculated total
    const amount = Number(order.total);
    const currency = order.currency || 'INR';

    // Create provider order
    const providerResult = await this.razorpayProvider.createPaymentOrder({
      orderId: order.id,
      amount,
      currency,
    });

    // Create or update local Payment record
    const payment = await this.prisma.payment.create({
      data: {
        storeId,
        orderId: order.id,
        provider: providerResult.provider,
        providerOrderId: providerResult.providerOrderId,
        amount,
        currency,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      paymentId: payment.id,
      provider: payment.provider,
      providerOrderId: providerResult.providerOrderId,
      amount,
      currency,
      keyId: providerResult.keyId,
    };
  }

  async verifyPayment(storeId: string, userId: string, dto: VerifyPaymentDto): Promise<any> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);

    // Find local Payment by providerOrderId
    const payment = await this.prisma.payment.findFirst({
      where: { providerOrderId: dto.razorpay_order_id, storeId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found for provider order');
    }

    // Verify order customer ownership
    if (payment.order.customerId !== customer.id) {
      throw new NotFoundException('Order does not belong to customer');
    }

    // Idempotency: Return immediately if already verified and captured
    if (payment.status === PaymentStatus.CAPTURED && payment.order.paymentStatus === OrderPaymentStatus.PAID) {
      return { success: true, message: 'Payment already verified', orderId: payment.orderId };
    }

    // Verify HMAC-SHA256 signature server-side
    const isValidSignature = this.razorpayProvider.verifyPaymentSignature({
      providerOrderId: dto.razorpay_order_id,
      providerPaymentId: dto.razorpay_payment_id,
      signature: dto.razorpay_signature,
    });

    if (!isValidSignature) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, providerPaymentId: dto.razorpay_payment_id },
      });
      throw new BadRequestException('Invalid payment signature');
    }

    // Transactionally update Payment and Order statuses
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CAPTURED,
          providerPaymentId: dto.razorpay_payment_id,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: OrderPaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
        },
      });
    });

    return {
      success: true,
      orderId: payment.orderId,
      paymentId: payment.id,
      status: PaymentStatus.CAPTURED,
    };
  }

  async handleRazorpayWebhook(rawBody: string | Buffer, signature: string, payload: any): Promise<any> {
    const isValid = this.razorpayProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    if (!paymentEntity) {
      return { received: true };
    }

    const providerOrderId = paymentEntity.order_id;
    const providerPaymentId = paymentEntity.id;

    const payment = await this.prisma.payment.findFirst({
      where: { providerOrderId },
      include: { order: true },
    });

    if (!payment) {
      return { received: true };
    }

    if (event === 'payment.captured') {
      if (payment.status !== PaymentStatus.CAPTURED) {
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.CAPTURED,
              providerPaymentId,
              metadata: payload,
            },
          });
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: OrderPaymentStatus.PAID,
              status: OrderStatus.CONFIRMED,
            },
          });
        });
      }
    } else if (event === 'payment.failed') {
      if (payment.status !== PaymentStatus.FAILED) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            providerPaymentId,
            metadata: payload,
          },
        });
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: OrderPaymentStatus.FAILED },
        });
      }
    }

    return { received: true };
  }
}
