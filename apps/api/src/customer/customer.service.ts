import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or automatically create Customer profile for an authenticated User within current Store tenant.
   */
  async getOrCreateCustomer(storeId: string, userId: string): Promise<any> {
    let customer = await this.prisma.customer.findUnique({
      where: { storeId_userId: { storeId, userId } },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      },
    });

    if (!customer) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      customer = await this.prisma.customer.create({
        data: {
          storeId,
          userId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          addresses: true,
        },
      });
    }

    return customer;
  }

  async updateCustomer(storeId: string, userId: string, dto: UpdateCustomerDto): Promise<any> {
    const customer = await this.getOrCreateCustomer(storeId, userId);
    return this.prisma.customer.update({
      where: { id: customer.id },
      data: dto,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        addresses: true,
      },
    });
  }

  async getAddresses(storeId: string, userId: string): Promise<any[]> {
    const customer = await this.getOrCreateCustomer(storeId, userId);
    return this.prisma.customerAddress.findMany({
      where: { customerId: customer.id, storeId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(storeId: string, userId: string, dto: CreateAddressDto): Promise<any> {
    const customer = await this.getOrCreateCustomer(storeId, userId);

    return this.prisma.$transaction(async (tx) => {
      // If setting as default, unset existing default addresses for this customer & store
      if (dto.isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: customer.id, storeId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Check if this is customer's first address — auto-set as default
      const count = await tx.customerAddress.count({
        where: { customerId: customer.id, storeId },
      });
      const isDefault = dto.isDefault || count === 0;

      return tx.customerAddress.create({
        data: {
          storeId,
          customerId: customer.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          latitude: dto.latitude !== undefined && dto.latitude !== null ? dto.latitude : null,
          longitude: dto.longitude !== undefined && dto.longitude !== null ? dto.longitude : null,
          placeId: dto.placeId || null,
          isDefault,
        },
      });
    });
  }

  async updateAddress(
    storeId: string,
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<any> {
    const customer = await this.getOrCreateCustomer(storeId, userId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId: customer.id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Address not found or does not belong to customer');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId: customer.id, storeId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.update({
        where: { id: addressId },
        data: dto,
      });
    });
  }

  async deleteAddress(storeId: string, userId: string, addressId: string): Promise<any> {
    const customer = await this.getOrCreateCustomer(storeId, userId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId: customer.id, storeId },
    });
    if (!existing) {
      throw new NotFoundException('Address not found or does not belong to customer');
    }

    return this.prisma.customerAddress.delete({ where: { id: addressId } });
  }
}
