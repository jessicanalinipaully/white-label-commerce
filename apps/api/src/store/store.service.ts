import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { AddDomainDto } from './dto/add-domain.dto';
import { AddStoreUserDto } from './dto/add-store-user.dto';
import { StoreUserRole } from '@commerce/types';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper utility to normalize hostname/domain strings:
   * - Trim whitespace
   * - Convert to lowercase
   * - Strip optional port numbers (e.g., "urbanthread.localhost:4000" -> "urbanthread.localhost")
   */
  normalizeDomain(rawDomain: string): string {
    if (!rawDomain) return '';
    let domain = rawDomain.trim().toLowerCase();
    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '');
    // Remove port if present
    const portIndex = domain.indexOf(':');
    if (portIndex !== -1) {
      domain = domain.substring(0, portIndex);
    }
    // Remove trailing slashes
    return domain.replace(/\/+$/, '');
  }

  async createStore(dto: CreateStoreDto, ownerUserId?: string) {
    const normalizedDomain = this.normalizeDomain(dto.primaryDomain);
    const normalizedSlug = dto.slug.toLowerCase().trim();

    // Check slug uniqueness
    const existingSlug = await this.prisma.store.findUnique({
      where: { slug: normalizedSlug },
    });
    if (existingSlug) {
      throw new ConflictException('Store with this slug already exists');
    }

    // Check domain uniqueness
    const existingDomain = await this.prisma.storeDomain.findUnique({
      where: { domain: normalizedDomain },
    });
    if (existingDomain) {
      throw new ConflictException('Domain is already assigned to another store');
    }

    return this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: dto.name,
          slug: normalizedSlug,
          domains: {
            create: {
              domain: normalizedDomain,
              isPrimary: true,
            },
          },
          ...(ownerUserId
            ? {
                users: {
                  create: {
                    userId: ownerUserId,
                    role: StoreUserRole.OWNER,
                  },
                },
              }
            : {}),
        },
        include: {
          domains: true,
          users: true,
        },
      });

      return store;
    });
  }

  async findStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        domains: true,
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async findStoreBySlug(slug: string) {
    const normalizedSlug = slug.toLowerCase().trim();
    const store = await this.prisma.store.findUnique({
      where: { slug: normalizedSlug },
      include: {
        domains: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async findStoreByDomain(rawDomain: string) {
    const normalizedDomain = this.normalizeDomain(rawDomain);
    const storeDomain = await this.prisma.storeDomain.findUnique({
      where: { domain: normalizedDomain },
      include: {
        store: true,
      },
    });

    if (!storeDomain) {
      return null;
    }

    return {
      store: storeDomain.store,
      domain: storeDomain,
    };
  }

  async addDomain(storeId: string, dto: AddDomainDto) {
    const normalizedDomain = this.normalizeDomain(dto.domain);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const existingDomain = await this.prisma.storeDomain.findUnique({
      where: { domain: normalizedDomain },
    });
    if (existingDomain) {
      throw new ConflictException('Domain is already assigned to another store');
    }

    if (dto.isPrimary) {
      // Unset previous primary domains
      await this.prisma.storeDomain.updateMany({
        where: { storeId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.storeDomain.create({
      data: {
        storeId,
        domain: normalizedDomain,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async addStoreUser(storeId: string, dto: AddStoreUserDto) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.storeUser.upsert({
      where: {
        storeId_userId: {
          storeId,
          userId: dto.userId,
        },
      },
      update: {
        role: dto.role || StoreUserRole.OWNER,
      },
      create: {
        storeId,
        userId: dto.userId,
        role: dto.role || StoreUserRole.OWNER,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async listStoreMemberships(storeId: string) {
    return this.prisma.storeUser.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async verifyUserBelongsToStore(storeId: string, userId: string) {
    if (!storeId || !userId) return null;
    return this.prisma.storeUser.findUnique({
      where: {
        storeId_userId: {
          storeId,
          userId,
        },
      },
      include: {
        store: true,
      },
    });
  }

  async getUserMemberships(userId: string) {
    return this.prisma.storeUser.findMany({
      where: { userId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }
}
