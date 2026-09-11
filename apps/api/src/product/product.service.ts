import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { CreateImageDto, UpdateImageDto } from './dto/image.dto';
import { PaginatedResult } from '@commerce/types';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Products ──────────────────────────────────────────────────────────────

  async createProduct(storeId: string, dto: CreateProductDto): Promise<any> {
    const slug = dto.slug.toLowerCase().trim();

    const existing = await this.prisma.product.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });
    if (existing) {
      throw new ConflictException('Product with this slug already exists in this store');
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, storeId },
      });
      if (!cat) {
        throw new NotFoundException('Category not found in this store');
      }
    }

    return this.prisma.product.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        categoryId: dto.categoryId,
        description: dto.description,
        shortDescription: dto.shortDescription,
        sku: dto.sku,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        isActive: dto.isActive ?? true,
      },
      include: { category: true, images: true, variants: true },
    });
  }

  async findAllProducts(
    storeId: string,
    page = 1,
    limit = 20,
    search?: string,
    categoryId?: string,
    activeOnly?: boolean | string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<PaginatedResult<any>> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { storeId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (activeOnly !== undefined && activeOnly !== null) {
      where.isActive = activeOnly === true || activeOnly === 'true';
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: true },
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

  async findOneProduct(storeId: string, id: string): Promise<any> {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findProductBySlug(storeId: string, slug: string): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { storeId_slug: { storeId, slug: slug.toLowerCase().trim() } },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(storeId: string, id: string, dto: UpdateProductDto): Promise<any> {
    const product = await this.findOneProduct(storeId, id);

    if (dto.slug && dto.slug.toLowerCase().trim() !== product.slug) {
      const slug = dto.slug.toLowerCase().trim();
      const existing = await this.prisma.product.findUnique({
        where: { storeId_slug: { storeId, slug } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Product with this slug already exists in this store');
      }
      dto.slug = slug;
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, storeId },
      });
      if (!cat) {
        throw new NotFoundException('Category not found in this store');
      }
    }

    return this.prisma.product.update({
      where: { id: product.id },
      data: dto,
      include: { category: true, images: true, variants: true },
    });
  }

  async removeProduct(storeId: string, id: string): Promise<any> {
    const product = await this.findOneProduct(storeId, id);
    return this.prisma.product.delete({ where: { id: product.id } });
  }

  // ─── Variants ──────────────────────────────────────────────────────────────

  async createVariant(storeId: string, productId: string, dto: CreateVariantDto): Promise<any> {
    await this.findOneProduct(storeId, productId);

    const skuExists = await this.prisma.productVariant.findUnique({
      where: { storeId_sku: { storeId, sku: dto.sku } },
    });
    if (skuExists) {
      throw new ConflictException('Variant SKU already exists in this store');
    }

    return this.prisma.productVariant.create({
      data: {
        storeId,
        productId,
        name: dto.name,
        sku: dto.sku,
        price: dto.price,
        attributes: dto.attributes,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findVariants(storeId: string, productId: string): Promise<any[]> {
    await this.findOneProduct(storeId, productId);
    return this.prisma.productVariant.findMany({
      where: { productId, storeId },
      include: { inventory: true },
    });
  }

  async findOneVariant(storeId: string, productId: string, variantId: string): Promise<any> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, storeId },
      include: { inventory: true },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return variant;
  }

  async updateVariant(
    storeId: string,
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<any> {
    const variant = await this.findOneVariant(storeId, productId, variantId);

    if (dto.sku && dto.sku !== variant.sku) {
      const existing = await this.prisma.productVariant.findUnique({
        where: { storeId_sku: { storeId, sku: dto.sku } },
      });
      if (existing && existing.id !== variantId) {
        throw new ConflictException('Variant SKU already exists in this store');
      }
    }

    return this.prisma.productVariant.update({
      where: { id: variant.id },
      data: dto,
    });
  }

  async removeVariant(storeId: string, productId: string, variantId: string): Promise<any> {
    const variant = await this.findOneVariant(storeId, productId, variantId);
    return this.prisma.productVariant.delete({ where: { id: variant.id } });
  }

  // ─── Images ────────────────────────────────────────────────────────────────

  async createImage(storeId: string, productId: string, dto: CreateImageDto): Promise<any> {
    await this.findOneProduct(storeId, productId);
    return this.prisma.productImage.create({
      data: {
        productId,
        url: dto.url,
        altText: dto.altText,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findImages(storeId: string, productId: string): Promise<any[]> {
    await this.findOneProduct(storeId, productId);
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOneImage(storeId: string, productId: string, imageId: string): Promise<any> {
    await this.findOneProduct(storeId, productId);
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    return image;
  }

  async updateImage(
    storeId: string,
    productId: string,
    imageId: string,
    dto: UpdateImageDto,
  ): Promise<any> {
    const image = await this.findOneImage(storeId, productId, imageId);
    return this.prisma.productImage.update({
      where: { id: image.id },
      data: dto,
    });
  }

  async removeImage(storeId: string, productId: string, imageId: string): Promise<any> {
    const image = await this.findOneImage(storeId, productId, imageId);
    return this.prisma.productImage.delete({ where: { id: image.id } });
  }
}
