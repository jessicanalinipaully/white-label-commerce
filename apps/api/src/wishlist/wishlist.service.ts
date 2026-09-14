import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CustomerService } from '../customer/customer.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
    private readonly cartService: CartService,
  ) {}

  /** Get or create persistent wishlist for the authenticated customer under the store tenant */
  async getOrCreateWishlist(storeId: string, userId: string): Promise<any> {
    const customer = await this.customerService.getOrCreateCustomer(storeId, userId);

    let wishlist = await this.prisma.wishlist.findUnique({
      where: { storeId_customerId: { storeId, customerId: customer.id } },
    });

    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
        data: {
          storeId,
          customerId: customer.id,
        },
      });
    }

    return wishlist;
  }

  /** Retrieve wishlist details formatted for the storefront */
  async getWishlistDetails(storeId: string, userId: string): Promise<any> {
    const wishlist = await this.getOrCreateWishlist(storeId, userId);

    const items = await this.prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const itemDetails = items
      .filter((item) => item.product && item.product.storeId === storeId)
      .map((item) => ({
        id: item.id,
        wishlistId: item.wishlistId,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        price: Number(item.product.price),
        compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
        image: item.product.images[0]?.url || null,
        isAvailable: item.product.isActive,
        categoryName: item.product.category?.name || null,
        createdAt: item.createdAt,
      }));

    return {
      id: wishlist.id,
      storeId: wishlist.storeId,
      customerId: wishlist.customerId,
      items: itemDetails,
      totalItems: itemDetails.length,
    };
  }

  /** Add a product to the customer's database wishlist */
  async addWishlistItem(storeId: string, userId: string, productId: string): Promise<any> {
    const wishlist = await this.getOrCreateWishlist(storeId, userId);

    // Validate product belongs to current tenant and is active
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId, isActive: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Check if already in wishlist
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });

    if (!existing) {
      await this.prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });
    }

    return this.getWishlistDetails(storeId, userId);
  }

  /** Remove a product from the customer's database wishlist */
  async removeWishlistItem(storeId: string, userId: string, productId: string): Promise<any> {
    const wishlist = await this.getOrCreateWishlist(storeId, userId);

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
    }

    return this.getWishlistDetails(storeId, userId);
  }

  /** Clear all items from the customer's wishlist */
  async clearWishlist(storeId: string, userId: string): Promise<any> {
    const wishlist = await this.getOrCreateWishlist(storeId, userId);
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });
    return this.getWishlistDetails(storeId, userId);
  }

  /** Merge guest wishlist product IDs into database wishlist */
  async mergeWishlist(storeId: string, userId: string, productIds: string[]): Promise<any> {
    const wishlist = await this.getOrCreateWishlist(storeId, userId);

    if (!productIds || productIds.length === 0) {
      return this.getWishlistDetails(storeId, userId);
    }

    // Validate product IDs belong to current store and are active
    const validProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds }, storeId, isActive: true },
      select: { id: true },
    });

    const validProductIds = validProducts.map((p) => p.id);

    if (validProductIds.length > 0) {
      await this.prisma.wishlistItem.createMany({
        data: validProductIds.map((pId) => ({
          wishlistId: wishlist.id,
          productId: pId,
        })),
        skipDuplicates: true,
      });
    }

    return this.getWishlistDetails(storeId, userId);
  }

  /** Move a wishlisted product to customer cart */
  async moveToCart(storeId: string, userId: string, productId: string): Promise<any> {
    // Validate product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId, isActive: true },
      include: { variants: { where: { isActive: true }, take: 1 } },
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    const firstVariant = product.variants[0];
    if (!firstVariant) {
      throw new BadRequestException('Product has no active variants');
    }

    // Add to cart
    await this.cartService.addItem(storeId, userId, {
      productId,
      variantId: firstVariant.id,
      quantity: 1,
    });

    // Remove from wishlist
    await this.removeWishlistItem(storeId, userId, productId);

    return this.getWishlistDetails(storeId, userId);
  }
}
