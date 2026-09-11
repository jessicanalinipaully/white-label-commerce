import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';
import { CreateImageDto, UpdateImageDto } from './dto/image.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAuthGuard } from '../tenant/tenant-auth.guard';
import { StoreRolesGuard } from '../common/guards/store-roles.guard';
import { StoreRoles } from '../common/decorators/store-roles.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { StoreUserRole, TenantContext } from '@commerce/types';
import { PaginatedResult } from '@commerce/types';

const READ_ROLES = [
  StoreUserRole.OWNER,
  StoreUserRole.ADMIN,
  StoreUserRole.MANAGER,
  StoreUserRole.INVENTORY_MANAGER,
  StoreUserRole.SUPPORT_AGENT,
];
const WRITE_ROLES = [StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER];

@Controller('products')
@UseGuards(JwtAuthGuard, TenantAuthGuard, StoreRolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ─── Products ──────────────────────────────────────────────────────────────

  @Post()
  @StoreRoles(...WRITE_ROLES)
  createProduct(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateProductDto): Promise<any> {
    return this.productService.createProduct(tenant.store.id, dto);
  }

  @Get()
  @StoreRoles(...READ_ROLES)
  findAllProducts(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('active') active?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResult<any>> {
    return this.productService.findAllProducts(tenant.store.id, page, limit, q, categoryId, active, sortBy, sortOrder);
  }

  @Get(':id')
  @StoreRoles(...READ_ROLES)
  findOneProduct(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<any> {
    return this.productService.findOneProduct(tenant.store.id, id);
  }

  @Patch(':id')
  @StoreRoles(...WRITE_ROLES)
  updateProduct(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<any> {
    return this.productService.updateProduct(tenant.store.id, id, dto);
  }

  @Delete(':id')
  @StoreRoles(...WRITE_ROLES)
  removeProduct(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<any> {
    return this.productService.removeProduct(tenant.store.id, id);
  }

  // ─── Variants ──────────────────────────────────────────────────────────────

  @Post(':productId/variants')
  @StoreRoles(...WRITE_ROLES)
  createVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<any> {
    return this.productService.createVariant(tenant.store.id, productId, dto);
  }

  @Get(':productId/variants')
  @StoreRoles(...READ_ROLES)
  findVariants(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
  ): Promise<any[]> {
    return this.productService.findVariants(tenant.store.id, productId);
  }

  @Patch(':productId/variants/:variantId')
  @StoreRoles(...WRITE_ROLES)
  updateVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<any> {
    return this.productService.updateVariant(tenant.store.id, productId, variantId, dto);
  }

  @Delete(':productId/variants/:variantId')
  @StoreRoles(...WRITE_ROLES)
  removeVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ): Promise<any> {
    return this.productService.removeVariant(tenant.store.id, productId, variantId);
  }

  // ─── Images ────────────────────────────────────────────────────────────────

  @Post(':productId/images')
  @StoreRoles(...WRITE_ROLES)
  createImage(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Body() dto: CreateImageDto,
  ): Promise<any> {
    return this.productService.createImage(tenant.store.id, productId, dto);
  }

  @Get(':productId/images')
  @StoreRoles(...READ_ROLES)
  findImages(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
  ): Promise<any[]> {
    return this.productService.findImages(tenant.store.id, productId);
  }

  @Patch(':productId/images/:imageId')
  @StoreRoles(...WRITE_ROLES)
  updateImage(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateImageDto,
  ): Promise<any> {
    return this.productService.updateImage(tenant.store.id, productId, imageId, dto);
  }

  @Delete(':productId/images/:imageId')
  @StoreRoles(...WRITE_ROLES)
  removeImage(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ): Promise<any> {
    return this.productService.removeImage(tenant.store.id, productId, imageId);
  }
}
