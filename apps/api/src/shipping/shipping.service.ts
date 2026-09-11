import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CustomerService } from '../customer/customer.service';
import { DevelopmentShippingProvider } from './providers/development.provider';

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
    private readonly devShippingProvider: DevelopmentShippingProvider,
  ) {}

  /**
   * Get active tenant shipping rates. Automatically seeds default standard & express rates if store has none.
   */
  async getPublicRates(storeId: string): Promise<any[]> {
    let rates = await this.devShippingProvider.getRates(storeId);

    if (rates.length === 0) {
      // Seed default shipping rates for this store tenant
      await this.prisma.shippingRate.createMany({
        data: [
          {
            storeId,
            name: 'Standard Surface Shipping',
            provider: 'STANDARD_DELIVERY',
            amount: 50.0,
            currency: 'INR',
            estimatedDaysMin: 3,
            estimatedDaysMax: 5,
            isActive: true,
          },
          {
            storeId,
            name: 'Express Air Courier',
            provider: 'EXPRESS_COURIER',
            amount: 120.0,
            currency: 'INR',
            estimatedDaysMin: 1,
            estimatedDaysMax: 2,
            isActive: true,
          },
        ],
      });
      rates = await this.devShippingProvider.getRates(storeId);
    }

    return rates;
  }

  /**
   * Attach selected shipping rate to an order and transactionally recalculate total.
   */
  async attachShippingRateToOrder(
    storeId: string,
    userId: string,
    orderId: string,
    shippingRateId: string,
  ): Promise<any> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);

    // Validate order ownership & tenant
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: customer.id, storeId },
    });
    if (!order) {
      throw new NotFoundException('Order not found or does not belong to customer');
    }

    // Validate shipping rate belongs to current store & is active
    const rate = await this.prisma.shippingRate.findFirst({
      where: { id: shippingRateId, storeId, isActive: true },
    });
    if (!rate) {
      throw new BadRequestException('Invalid or inactive shipping rate for store');
    }

    const shippingAmount = Number(rate.amount);
    const subtotal = Number(order.subtotal);
    const taxAmount = Number(order.taxAmount);
    const discountAmount = Number(order.discountAmount);

    // Server-side recalculation of final authoritative total
    const total = subtotal + shippingAmount + taxAmount - discountAmount;

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        shippingRateId: rate.id,
        shippingAmount,
        shippingProvider: rate.provider,
        total,
      },
      include: {
        items: true,
        shippingRate: true,
      },
    });
  }
}
