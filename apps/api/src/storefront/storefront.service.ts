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
  size?: string;
  color?: string;
  inStock?: boolean;
  discount?: number;
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

  async getProducts(storeId: string, query: StorefrontProductQuery): Promise<PaginatedResult<any> & { filterOptions?: any }> {
    const pageNum = Math.max(1, Number(query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Always scope to tenant + active products only
    const where: any = { storeId, isActive: true };

    if (query.categoryId) {
      const rawCats = query.categoryId.split(',').map((c) => c.trim()).filter(Boolean);
      if (rawCats.length > 0) {
        const validCats = await this.prisma.category.findMany({
          where: {
            storeId,
            isActive: true,
            OR: [
              { id: { in: rawCats } },
              { slug: { in: rawCats } },
            ],
          },
          select: { id: true },
        });
        const validCatIds = validCats.map((c) => c.id);
        if (validCatIds.length > 0) {
          where.categoryId = { in: validCatIds };
        } else {
          where.categoryId = 'no-matching-category';
        }
      }
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
    if (query.minPrice !== undefined && !isNaN(Number(query.minPrice))) {
      priceFilter.gte = Number(query.minPrice);
    }
    if (query.maxPrice !== undefined && !isNaN(Number(query.maxPrice))) {
      priceFilter.lte = Number(query.maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }

    const sizes = query.size ? query.size.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const colors = query.color ? query.color.split(',').map((c) => c.trim()).filter(Boolean) : [];
    const inStockOnly = query.inStock === true;

    const variantConditions: any[] = [{ isActive: true }];

    if (inStockOnly) {
      variantConditions.push({
        inventory: {
          is: {
            quantity: { gt: 0 },
          },
        },
      });
    }

    if (sizes.length > 0) {
      variantConditions.push({
        OR: sizes.flatMap((s) => [
          { attributes: { path: ['size'], equals: s } },
          { attributes: { path: ['Size'], equals: s } },
        ]),
      });
    }

    if (colors.length > 0) {
      variantConditions.push({
        OR: colors.flatMap((c) => [
          { attributes: { path: ['color'], equals: c } },
          { attributes: { path: ['Color'], equals: c } },
        ]),
      });
    }

    if (variantConditions.length > 1 || sizes.length > 0 || colors.length > 0 || inStockOnly) {
      where.variants = {
        some: {
          AND: variantConditions,
        },
      };
    }

    if (query.discount !== undefined && !isNaN(Number(query.discount)) && Number(query.discount) > 0) {
      const threshold = Number(query.discount) / 100;
      const rawRows: { id: string }[] = await this.prisma.$queryRaw`
        SELECT id FROM "Product"
        WHERE "storeId" = ${storeId}
          AND "isActive" = true
          AND "compareAtPrice" IS NOT NULL
          AND "compareAtPrice" > 0
          AND ("compareAtPrice" - "price") / "compareAtPrice" >= ${threshold}
      `;
      const discountedIds = rawRows.map((r) => r.id);
      where.id = { in: discountedIds };
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (query.sortBy) {
      case 'price_asc': orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      case 'name_asc': orderBy = { name: 'asc' }; break;
      case 'name_desc': orderBy = { name: 'desc' }; break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'featured': orderBy = { createdAt: 'desc' }; break;
    }

    const [data, total, categories, allStoreVariants, priceBoundsAgg] = await Promise.all([
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
      this.getCategories(storeId),
      this.prisma.productVariant.findMany({
        where: { storeId, isActive: true, product: { isActive: true } },
        select: { attributes: true },
      }),
      this.prisma.product.aggregate({
        where: { storeId, isActive: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    const sizeSet = new Set<string>();
    const colorSet = new Set<string>();
    for (const v of allStoreVariants) {
      const attrs = (v.attributes as Record<string, any>) || {};
      const sizeVal = attrs.size || attrs.Size;
      const colorVal = attrs.color || attrs.Color;
      if (sizeVal && typeof sizeVal === 'string') sizeSet.add(sizeVal);
      if (colorVal && typeof colorVal === 'string') colorSet.add(colorVal);
    }

    const filterOptions = {
      categories,
      availableSizes: Array.from(sizeSet).sort(),
      availableColors: Array.from(colorSet).sort(),
      priceBounds: {
        min: priceBoundsAgg._min.price ? Number(priceBoundsAgg._min.price) : 0,
        max: priceBoundsAgg._max.price ? Number(priceBoundsAgg._max.price) : 0,
      },
    };

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      filterOptions,
    };
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
