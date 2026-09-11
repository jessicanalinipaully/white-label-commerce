import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateInventoryDto, InventoryAdjustDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify the variant belongs to the given store (tenant isolation at query level)
   */
  private async verifyVariantOwnership(storeId: string, variantId: string): Promise<any> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, storeId },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return variant;
  }

  async getInventory(storeId: string, variantId: string): Promise<any> {
    await this.verifyVariantOwnership(storeId, variantId);

    const inventory = await this.prisma.inventory.findUnique({
      where: { variantId },
      include: {
        variant: { select: { id: true, name: true, sku: true, productId: true } },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found for this variant');
    }

    return {
      ...inventory,
      available: inventory.quantity - inventory.reservedQuantity,
    };
  }

  async updateInventory(storeId: string, variantId: string, dto: UpdateInventoryDto): Promise<any> {
    await this.verifyVariantOwnership(storeId, variantId);

    const current = await this.prisma.inventory.findUnique({ where: { variantId } });
    if (!current) {
      throw new NotFoundException('Inventory record not found for this variant');
    }

    const newQuantity = dto.quantity ?? current.quantity;
    const newReserved = dto.reservedQuantity ?? current.reservedQuantity;

    if (newReserved > newQuantity) {
      throw new BadRequestException('Reserved quantity cannot exceed total quantity');
    }

    return this.prisma.inventory.update({
      where: { variantId },
      data: dto,
    });
  }

  async increaseQuantity(storeId: string, variantId: string, dto: InventoryAdjustDto): Promise<any> {
    await this.verifyVariantOwnership(storeId, variantId);

    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({ where: { variantId } });
      if (!inventory) {
        throw new NotFoundException('Inventory record not found for this variant');
      }

      return tx.inventory.update({
        where: { variantId },
        data: { quantity: inventory.quantity + dto.amount },
      });
    });
  }

  async decreaseQuantity(storeId: string, variantId: string, dto: InventoryAdjustDto): Promise<any> {
    await this.verifyVariantOwnership(storeId, variantId);

    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({ where: { variantId } });
      if (!inventory) {
        throw new NotFoundException('Inventory record not found for this variant');
      }

      const newQuantity = inventory.quantity - dto.amount;
      if (newQuantity < 0) {
        throw new BadRequestException(
          `Cannot decrease inventory: would result in negative quantity (current: ${inventory.quantity}, decrease: ${dto.amount})`,
        );
      }

      if (inventory.reservedQuantity > newQuantity) {
        throw new BadRequestException(
          `Cannot decrease inventory: reserved quantity (${inventory.reservedQuantity}) would exceed new total (${newQuantity})`,
        );
      }

      return tx.inventory.update({
        where: { variantId },
        data: { quantity: newQuantity },
      });
    });
  }

  async checkAvailability(storeId: string, variantId: string): Promise<any> {
    await this.verifyVariantOwnership(storeId, variantId);

    const inventory = await this.prisma.inventory.findUnique({ where: { variantId } });
    if (!inventory) {
      return { available: false, quantity: 0, reservedQuantity: 0, availableQuantity: 0 };
    }

    const availableQuantity = inventory.quantity - inventory.reservedQuantity;
    return {
      available: availableQuantity > 0,
      quantity: inventory.quantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity,
      isLowStock: availableQuantity <= inventory.lowStockThreshold,
      lowStockThreshold: inventory.lowStockThreshold,
    };
  }
}
