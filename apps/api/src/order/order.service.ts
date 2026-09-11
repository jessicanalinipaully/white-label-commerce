import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CustomerService } from '../customer/customer.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CartStatus, OrderStatus, OrderPaymentStatus, PaginatedResult, PaymentStatus } from '@commerce/types';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
  ) {}

  /** Generate unique human-readable order number, e.g. ORD-20260911-A1B2C3 */
  private async generateOrderNumber(tx: any): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let orderNumber = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      orderNumber = `ORD-${dateStr}-${randStr}`;
      const existing = await tx.order.findUnique({ where: { orderNumber } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      orderNumber = `ORD-${dateStr}-${Date.now()}`;
    }

    return orderNumber;
  }

  /**
   * Execute transactional checkout:
   * 1. Validate customer & address ownership
   * 2. Load active cart
   * 3. Validate active status & inventory for all items
   * 4. Deduct inventory transactionally
   * 5. Create Order & OrderItems with snapshots
   * 6. Mark Cart status CONVERTED
   */
  async checkout(storeId: string, userId: string, dto: CheckoutDto): Promise<any> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);

    // Validate shipping address belongs to customer & store
    const shippingAddress = await this.prisma.customerAddress.findFirst({
      where: { id: dto.shippingAddressId, customerId: customer.id, storeId },
    });
    if (!shippingAddress) {
      throw new BadRequestException('Invalid shipping address for customer');
    }

    let billingAddress = shippingAddress;
    if (dto.billingAddressId && dto.billingAddressId !== dto.shippingAddressId) {
      const found = await this.prisma.customerAddress.findFirst({
        where: { id: dto.billingAddressId, customerId: customer.id, storeId },
      });
      if (!found) {
        throw new BadRequestException('Invalid billing address for customer');
      }
      billingAddress = found;
    }

    // Load active cart
    const cart = await this.prisma.cart.findFirst({
      where: { storeId, customerId: customer.id, status: CartStatus.ACTIVE },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
            variant: { include: { inventory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Perform atomic checkout transaction
    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: any[] = [];

      for (const item of cart.items) {
        // Validate product/variant tenant ownership
        if (item.product.storeId !== storeId || item.variant.storeId !== storeId) {
          throw new BadRequestException(`Product ${item.product.name} does not belong to store`);
        }

        // Validate active status
        if (!item.product.isActive || !item.variant.isActive) {
          throw new BadRequestException(`Product or variant "${item.product.name}" is no longer available`);
        }

        // Re-check inventory availability inside transaction
        const inventory = await tx.inventory.findUnique({
          where: { variantId: item.variantId },
        });

        if (!inventory) {
          throw new BadRequestException(`Inventory not found for variant ${item.variant.name}`);
        }

        const available = inventory.quantity - inventory.reservedQuantity;
        if (item.quantity > available) {
          throw new BadRequestException(
            `Insufficient inventory for "${item.product.name} - ${item.variant.name}". Requested: ${item.quantity}, Available: ${available}`,
          );
        }

        // Deduct inventory transactionally
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Server-side price calculation
        const unitPrice = item.variant.price !== null && item.variant.price !== undefined
          ? Number(item.variant.price)
          : Number(item.product.price);

        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          variantName: item.variant.name,
          sku: item.variant.sku,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          productImageUrl: item.product.images[0]?.url || null,
        });
      }

      const orderNumber = await this.generateOrderNumber(tx);
      const shippingAmount = 0;
      const taxAmount = 0;
      const discountAmount = 0;
      const total = subtotal + shippingAmount + taxAmount - discountAmount;

      // Address snapshot
      const shippingAddressSnapshot = {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      };

      const billingAddressSnapshot = {
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        phone: billingAddress.phone,
        addressLine1: billingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2,
        city: billingAddress.city,
        state: billingAddress.state,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
      };

      // Create Order
      const order = await tx.order.create({
        data: {
          storeId,
          customerId: customer.id,
          orderNumber,
          status: OrderStatus.PENDING,
          paymentStatus: OrderPaymentStatus.PENDING,
          subtotal,
          shippingAmount,
          taxAmount,
          discountAmount,
          total,
          currency: 'INR',
          shippingAddressSnapshot,
          billingAddressSnapshot,
          notes: dto.notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Mark active cart CONVERTED
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.CONVERTED },
      });

      return order;
    });
  }

  async getCustomerOrders(
    storeId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<any>> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = { storeId, customerId: customer.id };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getCustomerOrderById(storeId: string, userId: string, orderId: string): Promise<any> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: customer.id, storeId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found or does not belong to current customer');
    }

    return order;
  }
}
