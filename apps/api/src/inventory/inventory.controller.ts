import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryAdjustDto, UpdateInventoryDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAuthGuard } from '../tenant/tenant-auth.guard';
import { StoreRolesGuard } from '../common/guards/store-roles.guard';
import { StoreRoles } from '../common/decorators/store-roles.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { StoreUserRole, TenantContext } from '@commerce/types';

const INVENTORY_READ_ROLES = [
  StoreUserRole.OWNER,
  StoreUserRole.ADMIN,
  StoreUserRole.MANAGER,
  StoreUserRole.INVENTORY_MANAGER,
  StoreUserRole.SUPPORT_AGENT,
];
const INVENTORY_WRITE_ROLES = [
  StoreUserRole.OWNER,
  StoreUserRole.ADMIN,
  StoreUserRole.MANAGER,
  StoreUserRole.INVENTORY_MANAGER,
];

@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantAuthGuard, StoreRolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':variantId')
  @StoreRoles(...INVENTORY_READ_ROLES)
  getInventory(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
  ): Promise<any> {
    return this.inventoryService.getInventory(tenant.store.id, variantId);
  }

  @Patch(':variantId')
  @StoreRoles(...INVENTORY_WRITE_ROLES)
  updateInventory(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateInventoryDto,
  ): Promise<any> {
    return this.inventoryService.updateInventory(tenant.store.id, variantId, dto);
  }

  @Post(':variantId/increase')
  @HttpCode(200)
  @StoreRoles(...INVENTORY_WRITE_ROLES)
  increaseQuantity(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
    @Body() dto: InventoryAdjustDto,
  ): Promise<any> {
    return this.inventoryService.increaseQuantity(tenant.store.id, variantId, dto);
  }

  @Post(':variantId/decrease')
  @HttpCode(200)
  @StoreRoles(...INVENTORY_WRITE_ROLES)
  decreaseQuantity(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
    @Body() dto: InventoryAdjustDto,
  ): Promise<any> {
    return this.inventoryService.decreaseQuantity(tenant.store.id, variantId, dto);
  }

  @Get(':variantId/availability')
  @StoreRoles(...INVENTORY_READ_ROLES)
  checkAvailability(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
  ): Promise<any> {
    return this.inventoryService.checkAvailability(tenant.store.id, variantId);
  }
}
