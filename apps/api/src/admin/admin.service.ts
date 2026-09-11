import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderPaymentStatus, OrderStatus } from '@commerce/types';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateShippingRateDto,
  CreateVariantDto,
  AdjustInventoryDto,
  UpdateCategoryDto,
  UpdateInventoryDto,
  UpdateOrderStatusDto,
  UpdateProductDto,
  UpdateShippingRateDto,
  UpdateStoreDto,
  UpdateVariantDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** 1. DASHBOARD OVERVIEW */
  async getDashboard(storeId: string): Promise<any> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, slug: true },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const [
      totalProducts,
      activeProducts,
      totalCustomers,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      pendingPayments,
      paidOrders,
      recentOrders,
      recentCustomers,
      variants,
    ] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.product.count({ where: { storeId, isActive: true } }),
      this.prisma.customer.count({ where: { storeId } }),
      this.prisma.order.count({ where: { storeId } }),
      this.prisma.order.count({ where: { storeId, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { storeId, status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { storeId, status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { storeId, status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { storeId, status: OrderStatus.CANCELLED } }),
      this.prisma.order.count({ where: { storeId, paymentStatus: OrderPaymentStatus.PENDING } }),
      this.prisma.order.count({ where: { storeId, paymentStatus: OrderPaymentStatus.PAID } }),
      this.prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: true },
      }),
      this.prisma.customer.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.productVariant.findMany({
        where: { storeId },
        include: { inventory: true },
      }),
    ]);

    // Calculate low-stock variants
    const lowStockVariants = variants.filter(
      (v) => v.inventory && v.inventory.quantity <= v.inventory.lowStockThreshold,
    ).length;

    // Calculate total revenue from PAID orders
    const paidOrdersList = await this.prisma.order.findMany({
      where: { storeId, paymentStatus: OrderPaymentStatus.PAID },
      select: { total: true },
    });

    const totalRevenue = paidOrdersList.reduce((acc, order) => acc + Number(order.total), 0);

    return {
      storeName: store.name,
      totalProducts,
      activeProducts,
      lowStockVariants,
      totalCustomers,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      pendingPayments,
      paidOrders,
      totalRevenue,
      recentOrders,
      recentCustomers,
    };
  }

  /** 2. PRODUCTS */
  async getProducts(
    storeId: string,
    page = 1,
    limit = 20,
    search?: string,
    categoryId?: string,
  ): Promise<any> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { storeId };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { include: { inventory: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getProductById(storeId: string, id: string): Promise<any> {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true } },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found in current store');
    }
    return product;
  }

  async createProduct(storeId: string, dto: CreateProductDto): Promise<any> {
    if (dto.price !== undefined && dto.price < 0) {
      throw new BadRequestException('Product price cannot be negative');
    }

    const slug = (dto.slug || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug uniqueness within store
    const existingSlug = await this.prisma.product.findFirst({
      where: { storeId, slug },
    });
    if (existingSlug) {
      throw new BadRequestException(`Product with slug "${slug}" already exists in this store`);
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, storeId },
      });
      if (!category) {
        throw new BadRequestException('Invalid category for current store');
      }
    }

    const sku = dto.sku || `SKU-${Date.now()}`;

    // Create product, image, and default variant inside a transaction
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          storeId,
          categoryId: dto.categoryId || null,
          name: dto.name,
          slug,
          description: dto.description || null,
          shortDescription: dto.shortDescription || null,
          sku,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice !== undefined ? dto.compareAtPrice : null,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          images: dto.images
            ? {
                create: dto.images.map((img, idx) => ({
                  url: img.url,
                  altText: img.altText || dto.name,
                  sortOrder: img.sortOrder ?? idx,
                })),
              }
            : undefined,
        },
      });

      // Default variant
      const variant = await tx.productVariant.create({
        data: {
          storeId,
          productId: product.id,
          name: 'Default',
          sku: `${sku}-DEF`,
          price: dto.price,
          attributes: {},
          isActive: true,
        },
      });

      await tx.inventory.create({
        data: {
          storeId,
          variantId: variant.id,
          quantity: 100,
          reservedQuantity: 0,
          lowStockThreshold: 5,
        },
      });

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          images: true,
          variants: { include: { inventory: true } },
        },
      });
    });
  }

  async updateProduct(storeId: string, id: string, dto: UpdateProductDto): Promise<any> {
    const existing = await this.prisma.product.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found in current store');
    }

    if (dto.price !== undefined && dto.price < 0) {
      throw new BadRequestException('Product price cannot be negative');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, storeId },
      });
      if (!category) {
        throw new BadRequestException('Invalid category for current store');
      }
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const conflicting = await this.prisma.product.findFirst({
        where: { storeId, slug, NOT: { id } },
      });
      if (conflicting) {
        throw new BadRequestException(`Product with slug "${slug}" already exists in this store`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        slug,
        description: dto.description !== undefined ? dto.description : existing.description,
        shortDescription: dto.shortDescription !== undefined ? dto.shortDescription : existing.shortDescription,
        price: dto.price !== undefined ? dto.price : existing.price,
        compareAtPrice: dto.compareAtPrice !== undefined ? dto.compareAtPrice : existing.compareAtPrice,
        categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
        sku: dto.sku !== undefined ? dto.sku : existing.sku,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
      include: {
        category: true,
        images: true,
        variants: { include: { inventory: true } },
      },
    });
  }

  async deleteProduct(storeId: string, id: string): Promise<any> {
    const existing = await this.prisma.product.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found in current store');
    }

    // Check if referenced by order items
    const orderItemsCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      // Soft-delete / deactivate to preserve historical order integrity
      return this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  /** 3. CATEGORIES */
  async getCategories(storeId: string): Promise<any> {
    return this.prisma.category.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async getCategoryById(storeId: string, id: string): Promise<any> {
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
      include: { products: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found in current store');
    }
    return category;
  }

  async createCategory(storeId: string, dto: CreateCategoryDto): Promise<any> {
    const slug = (dto.slug || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSlug = await this.prisma.category.findFirst({
      where: { storeId, slug },
    });
    if (existingSlug) {
      throw new BadRequestException(`Category with slug "${slug}" already exists in this store`);
    }

    return this.prisma.category.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        description: dto.description || null,
        imageUrl: dto.imageUrl || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async updateCategory(storeId: string, id: string, dto: UpdateCategoryDto): Promise<any> {
    const existing = await this.prisma.category.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Category not found in current store');
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const conflicting = await this.prisma.category.findFirst({
        where: { storeId, slug, NOT: { id } },
      });
      if (conflicting) {
        throw new BadRequestException(`Category with slug "${slug}" already exists in this store`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        slug,
        description: dto.description !== undefined ? dto.description : existing.description,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : existing.imageUrl,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
    });
  }

  async deleteCategory(storeId: string, id: string): Promise<any> {
    const existing = await this.prisma.category.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Category not found in current store');
    }

    // Unlink products or soft-delete category
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      // Soft-deactivate to prevent breaking referenced products
      return this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /** 4. VARIANTS */
  async getProductVariants(storeId: string, productId: string): Promise<any> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) {
      throw new NotFoundException('Product not found in current store');
    }

    return this.prisma.productVariant.findMany({
      where: { productId, storeId },
      include: { inventory: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createVariant(storeId: string, productId: string, dto: CreateVariantDto): Promise<any> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) {
      throw new NotFoundException('Product not found in current store');
    }

    // Check SKU uniqueness in store
    const existingSku = await this.prisma.productVariant.findFirst({
      where: { storeId, sku: dto.sku },
    });
    if (existingSku) {
      throw new BadRequestException(`Variant SKU "${dto.sku}" already exists in this store`);
    }

    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          storeId,
          productId,
          name: dto.name,
          sku: dto.sku,
          price: dto.price !== undefined ? dto.price : null,
          attributes: dto.attributes || {},
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      await tx.inventory.create({
        data: {
          storeId,
          variantId: variant.id,
          quantity: dto.quantity !== undefined ? dto.quantity : 0,
          reservedQuantity: 0,
          lowStockThreshold: 5,
        },
      });

      return tx.productVariant.findUnique({
        where: { id: variant.id },
        include: { inventory: true },
      });
    });
  }

  async updateVariant(storeId: string, id: string, dto: UpdateVariantDto): Promise<any> {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Variant not found in current store');
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const conflicting = await this.prisma.productVariant.findFirst({
        where: { storeId, sku: dto.sku, NOT: { id } },
      });
      if (conflicting) {
        throw new BadRequestException(`Variant SKU "${dto.sku}" already exists in this store`);
      }
    }

    return this.prisma.productVariant.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        sku: dto.sku ?? existing.sku,
        price: dto.price !== undefined ? dto.price : existing.price,
        attributes: dto.attributes ?? existing.attributes,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
      include: { inventory: true },
    });
  }

  async deleteVariant(storeId: string, id: string): Promise<any> {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Variant not found in current store');
    }

    const orderItemsCount = await this.prisma.orderItem.count({
      where: { variantId: id },
    });

    if (orderItemsCount > 0) {
      return this.prisma.productVariant.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.productVariant.delete({
      where: { id },
    });
  }

  /** 5. INVENTORY */
  async getInventoryList(
    storeId: string,
    page = 1,
    limit = 20,
    lowStockOnly = false,
  ): Promise<any> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { storeId };

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          variant: {
            include: { product: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    let data = items.map((item) => ({
      ...item,
      availableQuantity: item.quantity - item.reservedQuantity,
      isLowStock: item.quantity <= item.lowStockThreshold,
    }));

    if (lowStockOnly) {
      data = data.filter((item) => item.isLowStock);
    }

    return {
      data,
      total: lowStockOnly ? data.length : total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((lowStockOnly ? data.length : total) / limitNum),
    };
  }

  async getInventoryByVariantId(storeId: string, variantId: string): Promise<any> {
    const inventory = await this.prisma.inventory.findFirst({
      where: { variantId, storeId },
      include: {
        variant: {
          include: { product: true },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found for variant in current store');
    }

    return {
      ...inventory,
      availableQuantity: inventory.quantity - inventory.reservedQuantity,
      isLowStock: inventory.quantity <= inventory.lowStockThreshold,
    };
  }

  async updateInventory(storeId: string, variantId: string, dto: UpdateInventoryDto): Promise<any> {
    const existing = await this.prisma.inventory.findFirst({
      where: { variantId, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Inventory record not found in current store');
    }

    if (dto.quantity !== undefined && dto.quantity < 0) {
      throw new BadRequestException('Inventory quantity cannot be negative');
    }

    const updated = await this.prisma.inventory.update({
      where: { id: existing.id },
      data: {
        quantity: dto.quantity !== undefined ? dto.quantity : existing.quantity,
        lowStockThreshold:
          dto.lowStockThreshold !== undefined ? dto.lowStockThreshold : existing.lowStockThreshold,
      },
      include: { variant: true },
    });

    return {
      ...updated,
      availableQuantity: updated.quantity - updated.reservedQuantity,
      isLowStock: updated.quantity <= updated.lowStockThreshold,
    };
  }

  async adjustInventory(storeId: string, variantId: string, dto: AdjustInventoryDto): Promise<any> {
    const existing = await this.prisma.inventory.findFirst({
      where: { variantId, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Inventory record not found in current store');
    }

    const newQuantity = existing.quantity + dto.adjustmentQuantity;
    if (newQuantity < 0) {
      throw new BadRequestException(
        `Inventory adjustment results in negative quantity (${newQuantity}). Current: ${existing.quantity}`,
      );
    }

    const updated = await this.prisma.inventory.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
      include: { variant: true },
    });

    return {
      ...updated,
      availableQuantity: updated.quantity - updated.reservedQuantity,
      isLowStock: updated.quantity <= updated.lowStockThreshold,
    };
  }

  /** 6. ORDERS */
  async getOrders(
    storeId: string,
    page = 1,
    limit = 20,
    status?: OrderStatus,
    paymentStatus?: OrderPaymentStatus,
    search?: string,
  ): Promise<any> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { storeId };
    if (status) {
      where.status = status;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (search) {
      where.orderNumber = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: true,
          payments: true,
          shippingRate: true,
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

  async getOrderById(storeId: string, id: string): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id, storeId },
      include: {
        customer: true,
        items: true,
        payments: true,
        shippingRate: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found in current store');
    }
    return order;
  }

  async updateOrderStatus(storeId: string, id: string, dto: UpdateOrderStatusDto): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id, storeId },
    });
    if (!order) {
      throw new NotFoundException('Order not found in current store');
    }

    const currentStatus = order.status;
    const targetStatus = dto.status;

    // Validate state transition matrix
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const validNext = allowedTransitions[currentStatus] || [];
    if (!validNext.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid order status transition from ${currentStatus} to ${targetStatus}`,
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: targetStatus },
      include: { customer: true, items: true },
    });
  }

  /** 7. CUSTOMERS */
  async getCustomers(storeId: string, page = 1, limit = 20, search?: string): Promise<any> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { storeId };
    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          orders: {
            where: { storeId },
            select: { id: true, total: true, paymentStatus: true, createdAt: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const data = customers.map((c) => {
      const paidOrders = c.orders.filter((o) => o.paymentStatus === OrderPaymentStatus.PAID);
      const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const latestOrder = c.orders.length > 0 ? c.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;

      return {
        id: c.id,
        storeId: c.storeId,
        email: c.user?.email || null,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        orderCount: c.orders.length,
        totalSpent,
        latestOrderDate: latestOrder?.createdAt || null,
        createdAt: c.createdAt,
      };
    });

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getCustomerById(storeId: string, id: string): Promise<any> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, storeId },
      include: {
        user: { select: { email: true } },
        addresses: true,
        orders: {
          where: { storeId },
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in current store');
    }

    const paidOrders = customer.orders.filter((o) => o.paymentStatus === OrderPaymentStatus.PAID);
    const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      ...customer,
      email: customer.user?.email || null,
      orderCount: customer.orders.length,
      totalSpent,
    };
  }

  /** 8. SHIPPING RATES */
  async getShippingRates(storeId: string): Promise<any> {
    return this.prisma.shippingRate.findMany({
      where: { storeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createShippingRate(storeId: string, dto: CreateShippingRateDto): Promise<any> {
    if (dto.amount < 0) {
      throw new BadRequestException('Shipping rate amount cannot be negative');
    }

    return this.prisma.shippingRate.create({
      data: {
        storeId,
        name: dto.name,
        provider: dto.provider,
        amount: dto.amount,
        currency: dto.currency || 'INR',
        estimatedDaysMin: dto.estimatedDaysMin ?? null,
        estimatedDaysMax: dto.estimatedDaysMax ?? null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async updateShippingRate(storeId: string, id: string, dto: UpdateShippingRateDto): Promise<any> {
    const existing = await this.prisma.shippingRate.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Shipping rate not found in current store');
    }

    if (dto.amount !== undefined && dto.amount < 0) {
      throw new BadRequestException('Shipping rate amount cannot be negative');
    }

    return this.prisma.shippingRate.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        provider: dto.provider ?? existing.provider,
        amount: dto.amount !== undefined ? dto.amount : existing.amount,
        currency: dto.currency ?? existing.currency,
        estimatedDaysMin: dto.estimatedDaysMin !== undefined ? dto.estimatedDaysMin : existing.estimatedDaysMin,
        estimatedDaysMax: dto.estimatedDaysMax !== undefined ? dto.estimatedDaysMax : existing.estimatedDaysMax,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
    });
  }

  async deleteShippingRate(storeId: string, id: string): Promise<any> {
    const existing = await this.prisma.shippingRate.findFirst({
      where: { id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Shipping rate not found in current store');
    }

    const ordersCount = await this.prisma.order.count({
      where: { shippingRateId: id },
    });

    if (ordersCount > 0) {
      return this.prisma.shippingRate.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.shippingRate.delete({
      where: { id },
    });
  }

  /** 9. STORE SETTINGS */
  async getStore(storeId: string): Promise<any> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        domains: true,
        users: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async updateStore(storeId: string, dto: UpdateStoreDto): Promise<any> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    let slug = store.slug;
    if (dto.slug && dto.slug !== store.slug) {
      slug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const conflicting = await this.prisma.store.findFirst({
        where: { slug, NOT: { id: storeId } },
      });
      if (conflicting) {
        throw new BadRequestException(`Store slug "${slug}" is already taken`);
      }
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        name: dto.name ?? store.name,
        slug,
      },
      include: { domains: true },
    });
  }

  /** 10. THEME MANAGEMENT */
  async getTheme(storeId: string): Promise<any> {
    let theme = await this.prisma.storeTheme.findUnique({
      where: { storeId },
    });
    if (!theme) {
      theme = await this.prisma.storeTheme.create({
        data: { storeId, name: 'Default Theme' },
      });
    }
    return theme;
  }

  async updateTheme(storeId: string, dto: any): Promise<any> {
    const headingFont = dto.headingFont || dto.fontFamilyHeading;
    const bodyFont = dto.bodyFont || dto.fontFamilyBody;

    return this.prisma.storeTheme.upsert({
      where: { storeId },
      create: {
        storeId,
        name: dto.name || 'Custom Theme',
        primaryColor: dto.primaryColor || '#4F46E5',
        secondaryColor: dto.secondaryColor || '#06B6D4',
        accentColor: dto.accentColor || '#F59E0B',
        backgroundColor: dto.backgroundColor || '#0F172A',
        textColor: dto.textColor || '#F8FAFC',
        headingFont: headingFont || 'INTER',
        bodyFont: bodyFont || 'INTER',
        borderRadius: dto.borderRadius || 'MEDIUM',
        buttonStyle: dto.buttonStyle || 'SOLID',
      },
      update: {
        name: dto.name !== undefined ? dto.name : undefined,
        primaryColor: dto.primaryColor !== undefined ? dto.primaryColor : undefined,
        secondaryColor: dto.secondaryColor !== undefined ? dto.secondaryColor : undefined,
        accentColor: dto.accentColor !== undefined ? dto.accentColor : undefined,
        backgroundColor: dto.backgroundColor !== undefined ? dto.backgroundColor : undefined,
        textColor: dto.textColor !== undefined ? dto.textColor : undefined,
        headingFont: headingFont !== undefined ? headingFont : undefined,
        bodyFont: bodyFont !== undefined ? bodyFont : undefined,
        borderRadius: dto.borderRadius !== undefined ? dto.borderRadius : undefined,
        buttonStyle: dto.buttonStyle !== undefined ? dto.buttonStyle : undefined,
      },
    });
  }

  /** 11. BRANDING MANAGEMENT */
  async getBranding(storeId: string): Promise<any> {
    let branding = await this.prisma.storeBranding.findUnique({
      where: { storeId },
    });
    if (!branding) {
      const store = await this.prisma.store.findUnique({ where: { id: storeId } });
      branding = await this.prisma.storeBranding.create({
        data: { storeId, storeDisplayName: store?.name || 'Store' },
      });
    }
    return branding;
  }

  async updateBranding(storeId: string, dto: any): Promise<any> {
    const displayName = dto.storeDisplayName !== undefined ? dto.storeDisplayName : dto.displayName;

    return this.prisma.storeBranding.upsert({
      where: { storeId },
      create: {
        storeId,
        logoUrl: dto.logoUrl || null,
        faviconUrl: dto.faviconUrl || null,
        storeDisplayName: displayName || null,
        tagline: dto.tagline || null,
        socialPreviewImageUrl: dto.socialPreviewImageUrl || null,
      },
      update: {
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : undefined,
        faviconUrl: dto.faviconUrl !== undefined ? dto.faviconUrl : undefined,
        storeDisplayName: displayName !== undefined ? displayName : undefined,
        tagline: dto.tagline !== undefined ? dto.tagline : undefined,
        socialPreviewImageUrl:
          dto.socialPreviewImageUrl !== undefined ? dto.socialPreviewImageUrl : undefined,
      },
    });
  }

  /** 12. HOMEPAGE CMS */
  async getHomepage(storeId: string): Promise<any> {
    let homepage = await this.prisma.storeHomepage.findUnique({
      where: { storeId },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: true,
            category: true,
          },
        },
      },
    });

    if (!homepage) {
      homepage = await this.prisma.storeHomepage.create({
        data: { storeId, title: 'Home' },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: { product: true, category: true },
          },
        },
      });
    }

    return homepage;
  }

  async updateHomepage(storeId: string, dto: any): Promise<any> {
    return this.prisma.storeHomepage.upsert({
      where: { storeId },
      create: {
        storeId,
        title: dto.title || 'Home',
        metaTitle: dto.metaTitle || null,
        metaDescription: dto.metaDescription || null,
      },
      update: {
        title: dto.title,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getHomepageSections(storeId: string): Promise<any> {
    const homepage = await this.getHomepage(storeId);
    return homepage.sections;
  }

  async createHomepageSection(storeId: string, dto: any): Promise<any> {
    const homepage = await this.getHomepage(storeId);

    const productIdsToCheck: string[] = [];
    if (dto.productId) productIdsToCheck.push(dto.productId);
    if (dto.config?.productIds && Array.isArray(dto.config.productIds)) {
      productIdsToCheck.push(...dto.config.productIds);
    }
    if (productIdsToCheck.length > 0) {
      const validCount = await this.prisma.product.count({
        where: { id: { in: productIdsToCheck }, storeId },
      });
      if (validCount !== productIdsToCheck.length) {
        throw new BadRequestException('Referenced product does not belong to current store');
      }
    }

    const categoryIdsToCheck: string[] = [];
    if (dto.categoryId) categoryIdsToCheck.push(dto.categoryId);
    if (dto.config?.categoryIds && Array.isArray(dto.config.categoryIds)) {
      categoryIdsToCheck.push(...dto.config.categoryIds);
    }
    if (categoryIdsToCheck.length > 0) {
      const validCount = await this.prisma.category.count({
        where: { id: { in: categoryIdsToCheck }, storeId },
      });
      if (validCount !== categoryIdsToCheck.length) {
        throw new BadRequestException('Referenced category does not belong to current store');
      }
    }

    const maxSort = await this.prisma.storeHomepageSection.aggregate({
      where: { homepageId: homepage.id },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSort._max.sortOrder ?? 0) + 1;

    const targetProductId = dto.productId || (dto.config?.productIds && dto.config.productIds[0]) || null;
    const targetCategoryId = dto.categoryId || (dto.config?.categoryIds && dto.config.categoryIds[0]) || null;

    return this.prisma.storeHomepageSection.create({
      data: {
        homepageId: homepage.id,
        type: dto.type,
        title: dto.title || null,
        subtitle: dto.subtitle || null,
        content: dto.content || null,
        imageUrl: dto.imageUrl || null,
        buttonText: dto.buttonText || null,
        buttonUrl: dto.buttonUrl || dto.buttonLink || null,
        productId: targetProductId,
        categoryId: targetCategoryId,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : nextSortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: { product: true, category: true },
    });
  }

  async updateHomepageSection(storeId: string, id: string, dto: any): Promise<any> {
    const homepage = await this.getHomepage(storeId);
    const existing = await this.prisma.storeHomepageSection.findFirst({
      where: { id, homepageId: homepage.id },
    });

    if (!existing) {
      throw new NotFoundException('Homepage section not found in current store');
    }

    const productIdsToCheck: string[] = [];
    if (dto.productId) productIdsToCheck.push(dto.productId);
    if (dto.config?.productIds && Array.isArray(dto.config.productIds)) {
      productIdsToCheck.push(...dto.config.productIds);
    }
    if (productIdsToCheck.length > 0) {
      const validCount = await this.prisma.product.count({
        where: { id: { in: productIdsToCheck }, storeId },
      });
      if (validCount !== productIdsToCheck.length) {
        throw new BadRequestException('Referenced product does not belong to current store');
      }
    }

    const categoryIdsToCheck: string[] = [];
    if (dto.categoryId) categoryIdsToCheck.push(dto.categoryId);
    if (dto.config?.categoryIds && Array.isArray(dto.config.categoryIds)) {
      categoryIdsToCheck.push(...dto.config.categoryIds);
    }
    if (categoryIdsToCheck.length > 0) {
      const validCount = await this.prisma.category.count({
        where: { id: { in: categoryIdsToCheck }, storeId },
      });
      if (validCount !== categoryIdsToCheck.length) {
        throw new BadRequestException('Referenced category does not belong to current store');
      }
    }

    const targetProductId = dto.productId !== undefined 
      ? dto.productId 
      : (dto.config?.productIds ? dto.config.productIds[0] : existing.productId);

    const targetCategoryId = dto.categoryId !== undefined 
      ? dto.categoryId 
      : (dto.config?.categoryIds ? dto.config.categoryIds[0] : existing.categoryId);

    return this.prisma.storeHomepageSection.update({
      where: { id },
      data: {
        type: dto.type ?? existing.type,
        title: dto.title !== undefined ? dto.title : existing.title,
        subtitle: dto.subtitle !== undefined ? dto.subtitle : existing.subtitle,
        content: dto.content !== undefined ? dto.content : existing.content,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : existing.imageUrl,
        buttonText: dto.buttonText !== undefined ? dto.buttonText : existing.buttonText,
        buttonUrl: dto.buttonUrl !== undefined ? dto.buttonUrl : (dto.buttonLink !== undefined ? dto.buttonLink : existing.buttonUrl),
        productId: targetProductId,
        categoryId: targetCategoryId,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
      include: { product: true, category: true },
    });
  }

  async deleteHomepageSection(storeId: string, id: string): Promise<any> {
    const homepage = await this.getHomepage(storeId);
    const existing = await this.prisma.storeHomepageSection.findFirst({
      where: { id, homepageId: homepage.id },
    });

    if (!existing) {
      throw new NotFoundException('Homepage section not found in current store');
    }

    return this.prisma.storeHomepageSection.delete({
      where: { id },
    });
  }

  async reorderHomepageSections(storeId: string, sectionIds: string[]): Promise<any> {
    const homepage = await this.getHomepage(storeId);

    // Validate that all sections belong to this homepage
    const sections = await this.prisma.storeHomepageSection.findMany({
      where: { homepageId: homepage.id, id: { in: sectionIds } },
    });

    if (sections.length !== sectionIds.length) {
      throw new BadRequestException('One or more section IDs do not belong to current store');
    }

    await this.prisma.$transaction(
      sectionIds.map((secId, idx) =>
        this.prisma.storeHomepageSection.update({
          where: { id: secId },
          data: { sortOrder: idx },
        }),
      ),
    );

    return this.getHomepageSections(storeId);
  }
}
