import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginatedResult } from '@commerce/types';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, dto: CreateCategoryDto): Promise<any> {
    const slug = dto.slug.toLowerCase().trim();

    const existing = await this.prisma.category.findUnique({
      where: {
        storeId_slug: {
          storeId,
          slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists in this store');
    }

    return this.prisma.category.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(storeId: string, page = 1, limit = 20): Promise<PaginatedResult<any>> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where: { storeId },
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({
        where: { storeId },
      }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(storeId: string, id: string): Promise<any> {
    // Strictly scoped by storeId to prevent cross-tenant access
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(storeId: string, id: string, dto: UpdateCategoryDto): Promise<any> {
    const category = await this.findOne(storeId, id);

    if (dto.slug && dto.slug.toLowerCase().trim() !== category.slug) {
      const slug = dto.slug.toLowerCase().trim();
      const existing = await this.prisma.category.findUnique({
        where: {
          storeId_slug: {
            storeId,
            slug,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this slug already exists in this store');
      }
      dto.slug = slug;
    }

    return this.prisma.category.update({
      where: { id: category.id },
      data: dto,
    });
  }

  async remove(storeId: string, id: string): Promise<any> {
    const category = await this.findOne(storeId, id);
    return this.prisma.category.delete({
      where: { id: category.id },
    });
  }
}
