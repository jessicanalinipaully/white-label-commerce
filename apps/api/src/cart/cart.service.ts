import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CustomerService } from '../customer/customer.service';
import { AddCartItemDto, LocalCartItemDto } from './dto/cart.dto';
import { CartStatus } from '@commerce/types';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
  ) {}

  /** Get or create active persistent cart for the authenticated customer */
  async getOrCreateActiveCart(storeId: string, userId: string): Promise<any> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);

    let cart = await this.prisma.cart.findFirst({
      where: { storeId, customerId: customer.id, status: CartStatus.ACTIVE },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          storeId,
          customerId: customer.id,
          status: CartStatus.ACTIVE,
        },
      });
    }

    return cart;
  }

  /**
   * Get detailed cart contents with server-recalculated prices.
   * Prices are ALWAYS derived from DB product/variant — never trusted from client.
   */
  async getCartDetails(storeId: string, userId: string): Promise<any> {
    const cart = await this.getOrCreateActiveCart(storeId, userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
        variant: {
          include: {
            inventory: true,
          },
        },
      },
    });

    let subtotal = 0;
    const itemDetails = items.map((item) => {
      // Validate tenant ownership
      if (item.product.storeId !== storeId || item.variant.storeId !== storeId) {
        throw new BadRequestException('Cart item does not belong to current store tenant');
      }

      const priceNum = item.variant.price !== null && item.variant.price !== undefined
        ? Number(item.variant.price)
        : Number(item.product.price);

      const lineTotal = priceNum * item.quantity;
      subtotal += lineTotal;

      const availableStock = item.variant.inventory
        ? item.variant.inventory.quantity - item.variant.inventory.reservedQuantity
        : 0;

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        variantId: item.variantId,
        variantName: item.variant.name,
        sku: item.variant.sku,
        unitPrice: priceNum,
        lineTotal,
        quantity: item.quantity,
        isAvailable: item.product.isActive && item.variant.isActive && availableStock >= item.quantity,
        availableStock,
        image: item.product.images[0]?.url || null,
      };
    });

    return {
      id: cart.id,
      storeId: cart.storeId,
      customerId: cart.customerId,
      status: cart.status,
      items: itemDetails,
      totalItems: itemDetails.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
    };
  }

  async addItem(storeId: string, userId: string, dto: AddCartItemDto): Promise<any> {
    const cart = await this.getOrCreateActiveCart(storeId, userId);

    // Validate product belongs to current tenant and is active
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, storeId, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Validate variant belongs to product & store, and is active
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: dto.variantId, productId: dto.productId, storeId, isActive: true },
      include: { inventory: true },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found or inactive');
    }

    // Check inventory availability
    const availableStock = variant.inventory
      ? variant.inventory.quantity - variant.inventory.reservedQuantity
      : 0;

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
    });

    const newQuantity = (existingItem?.quantity || 0) + dto.quantity;
    if (newQuantity > availableStock) {
      throw new BadRequestException(`Insufficient inventory available (requested ${newQuantity}, available ${availableStock})`);
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCartDetails(storeId, userId);
  }

  async updateItem(storeId: string, userId: string, itemId: string, quantity: number): Promise<any> {
    const cart = await this.getOrCreateActiveCart(storeId, userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: { include: { inventory: true } } },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const availableStock = item.variant.inventory
        ? item.variant.inventory.quantity - item.variant.inventory.reservedQuantity
        : 0;
      if (quantity > availableStock) {
        throw new BadRequestException(`Insufficient inventory available (requested ${quantity}, available ${availableStock})`);
      }
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return this.getCartDetails(storeId, userId);
  }

  async removeItem(storeId: string, userId: string, itemId: string): Promise<any> {
    const cart = await this.getOrCreateActiveCart(storeId, userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCartDetails(storeId, userId);
  }

  async clearCart(storeId: string, userId: string): Promise<any> {
    const cart = await this.getOrCreateActiveCart(storeId, userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCartDetails(storeId, userId);
  }

  async mergeLocalCart(storeId: string, userId: string, localItems: LocalCartItemDto[]): Promise<any> {
    if (!localItems || localItems.length === 0) {
      return this.getCartDetails(storeId, userId);
    }

    for (const item of localItems) {
      try {
        await this.addItem(storeId, userId, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      } catch {
        // Skip invalid/out-of-stock local items gracefully during migration
      }
    }

    return this.getCartDetails(storeId, userId);
  }
}
