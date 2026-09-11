import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaginatedResult } from '@commerce/types';

export interface StorefrontProductQuery {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

@Injectable()
export class StorefrontService {
  constructor(private readonly prisma: PrismaService) {}

  async getStoreInfo(storeId: string): Promise<any> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        domains: {
          where: { isPrimary: true },
          select: { domain: true, isPrimary: true },
        },
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async getCategories(storeId: string): Promise<any[]> {
    return this.prisma.category.findMany({
      where: { storeId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
  }

  async getProducts(storeId: string, query: StorefrontProductQuery): Promise<PaginatedResult<any>> {
    const pageNum = Math.max(1, Number(query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Always scope to tenant + active products only
    const where: any = { storeId, isActive: true };

    if (query.categoryId) {
      const cat = await this.prisma.category.findFirst({ where: { id: query.categoryId, storeId } });
      if (cat) where.categoryId = query.categoryId;
    }

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }

    const priceFilter: any = {};
    if (query.minPrice !== undefined && !isNaN(query.minPrice)) {
      priceFilter.gte = query.minPrice;
    }
    if (query.maxPrice !== undefined && !isNaN(query.maxPrice)) {
      priceFilter.lte = query.maxPrice;
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (query.sortBy) {
      case 'price_asc': orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      case 'name_asc': orderBy = { name: 'asc' }; break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              attributes: true,
              isActive: true,
              inventory: { select: { quantity: true, reservedQuantity: true } },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async getProductBySlug(storeId: string, slug: string): Promise<any> {
    const product = await this.prisma.product.findFirst({
      where: { storeId, slug: slug.toLowerCase().trim(), isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          where: { isActive: true },
          include: { inventory: { select: { quantity: true, reservedQuantity: true, lowStockThreshold: true } } },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getCategoryWithProducts(storeId: string, categorySlug: string, query: StorefrontProductQuery): Promise<any> {
    const category = await this.prisma.category.findFirst({
      where: { storeId, slug: categorySlug.toLowerCase().trim(), isActive: true },
    });
    if (!category) throw new NotFoundException('Category not found');

    const products = await this.getProducts(storeId, { ...query, categoryId: category.id });
    return { category, products };
  }

  async getStorefrontConfig(storeId: string): Promise<any> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, slug: true },
    });
    if (!store) throw new NotFoundException('Store not found');

    const [branding, theme, homepage] = await Promise.all([
      this.prisma.storeBranding.findUnique({ where: { storeId } }),
      this.prisma.storeTheme.findUnique({ where: { storeId } }),
      this.prisma.storeHomepage.findUnique({
        where: { storeId },
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              product: {
                where: { isActive: true },
                include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
              },
              category: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      store,
      branding: branding || {
        storeDisplayName: store.name,
        logoUrl: null,
        faviconUrl: null,
        tagline: null,
        socialPreviewImageUrl: null,
      },
      theme: theme || {
        primaryColor: '#000000',
        secondaryColor: '#4F46E5',
        accentColor: '#10B981',
        backgroundColor: '#FFFFFF',
        textColor: '#111827',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        borderRadius: '8px',
        buttonStyle: 'rounded',
      },
      homepage: homepage
        ? {
            id: homepage.id,
            title: homepage.title,
            metaTitle: homepage.metaTitle,
            metaDescription: homepage.metaDescription,
            sections: homepage.sections || [],
          }
        : { title: 'Home', sections: [] },
      sections: homepage?.sections || [],
    };
  }
}
