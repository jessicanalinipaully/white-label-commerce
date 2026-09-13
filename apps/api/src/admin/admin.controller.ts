import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAuthGuard } from '../tenant/tenant-auth.guard';
import { StoreRoleGuard } from './guards/store-role.guard';
import { StoreRoles } from './decorators/store-roles.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { OrderPaymentStatus, OrderStatus, StoreUserRole, TenantContext } from '@commerce/types';
import { AdminService } from './admin.service';
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
import {
  CreateHomepageSectionDto,
  ReorderHomepageSectionsDto,
  UpdateBrandingDto,
  UpdateHomepageDto,
  UpdateHomepageSectionDto,
  UpdateThemeDto,
} from './dto/theme-cms.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, TenantAuthGuard, StoreRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** 1. DASHBOARD */
  @Get('dashboard')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  getDashboard(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getDashboard(tenant.store.id);
  }

  /** 2. PRODUCTS */
  @Get('products')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.INVENTORY_MANAGER,
  )
  getProducts(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.adminService.getProducts(tenant.store.id, page, limit, search, categoryId);
  }

  @Get('products/:id')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.INVENTORY_MANAGER,
  )
  getProductById(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.getProductById(tenant.store.id, id);
  }

  @Post('products')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  createProduct(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateProductDto) {
    return this.adminService.createProduct(tenant.store.id, dto);
  }

  @Patch('products/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  updateProduct(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(tenant.store.id, id, dto);
  }

  @Delete('products/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  deleteProduct(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.deleteProduct(tenant.store.id, id);
  }

  /** 2.1 PRODUCT IMAGES */
  @Post('products/:productId/images')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  createProductImage(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Body() dto: { url: string; altText?: string; sortOrder?: number },
  ) {
    return this.adminService.createProductImage(tenant.store.id, productId, dto);
  }

  @Post('products/:productId/images/upload')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @UploadedFile() file: any,
    @Body() dto: { altText?: string },
  ) {
    return this.adminService.uploadProductImage(tenant.store.id, productId, file, dto?.altText);
  }

  @Delete('products/:productId/images/:imageId')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  deleteProductImage(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.adminService.deleteProductImage(tenant.store.id, productId, imageId);
  }

  /** 3. CATEGORIES */
  @Get('categories')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  getCategories(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getCategories(tenant.store.id);
  }

  @Get('categories/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  getCategoryById(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.getCategoryById(tenant.store.id, id);
  }

  @Post('categories')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  createCategory(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(tenant.store.id, dto);
  }

  @Patch('categories/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  updateCategory(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(tenant.store.id, id, dto);
  }

  @Delete('categories/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  deleteCategory(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.deleteCategory(tenant.store.id, id);
  }

  /** 4. VARIANTS */
  @Get('products/:productId/variants')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.INVENTORY_MANAGER,
  )
  getProductVariants(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
  ) {
    return this.adminService.getProductVariants(tenant.store.id, productId);
  }

  @Post('products/:productId/variants')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  createVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.adminService.createVariant(tenant.store.id, productId, dto);
  }

  @Patch('variants/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  updateVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.adminService.updateVariant(tenant.store.id, id, dto);
  }

  @Delete('variants/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  deleteVariant(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.deleteVariant(tenant.store.id, id);
  }

  /** 5. INVENTORY */
  @Get('inventory')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.INVENTORY_MANAGER,
  )
  getInventoryList(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('lowStockOnly') lowStockOnly?: boolean,
  ) {
    return this.adminService.getInventoryList(tenant.store.id, page, limit, lowStockOnly);
  }

  @Get('inventory/:variantId')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.INVENTORY_MANAGER,
  )
  getInventoryByVariantId(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
  ) {
    return this.adminService.getInventoryByVariantId(tenant.store.id, variantId);
  }

  @Patch('inventory/:variantId')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.INVENTORY_MANAGER)
  updateInventory(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.adminService.updateInventory(tenant.store.id, variantId, dto);
  }

  @Post('inventory/:variantId/adjust')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.INVENTORY_MANAGER)
  adjustInventory(
    @CurrentTenant() tenant: TenantContext,
    @Param('variantId') variantId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.adminService.adjustInventory(tenant.store.id, variantId, dto);
  }

  /** 6. ORDERS */
  @Get('orders')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.SUPPORT_AGENT,
  )
  getOrders(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: OrderPaymentStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders(tenant.store.id, page, limit, status, paymentStatus, search);
  }

  @Get('orders/:id')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.SUPPORT_AGENT,
  )
  getOrderById(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.getOrderById(tenant.store.id, id);
  }

  @Patch('orders/:id/status')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.SUPPORT_AGENT,
  )
  updateOrderStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(tenant.store.id, id, dto);
  }

  /** 7. CUSTOMERS */
  @Get('customers')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.SUPPORT_AGENT,
  )
  getCustomers(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getCustomers(tenant.store.id, page, limit, search);
  }

  @Get('customers/:id')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.SUPPORT_AGENT,
  )
  getCustomerById(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.getCustomerById(tenant.store.id, id);
  }

  /** 8. SHIPPING RATES */
  @Get('shipping-rates')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN)
  getShippingRates(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getShippingRates(tenant.store.id);
  }

  @Post('shipping-rates')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN)
  createShippingRate(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateShippingRateDto) {
    return this.adminService.createShippingRate(tenant.store.id, dto);
  }

  @Patch('shipping-rates/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN)
  updateShippingRate(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateShippingRateDto,
  ) {
    return this.adminService.updateShippingRate(tenant.store.id, id, dto);
  }

  @Delete('shipping-rates/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN)
  deleteShippingRate(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.deleteShippingRate(tenant.store.id, id);
  }

  /** 9. STORE SETTINGS */
  @Get('store')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN)
  getStore(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getStore(tenant.store.id);
  }

  @Patch('store')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN)
  updateStore(@CurrentTenant() tenant: TenantContext, @Body() dto: UpdateStoreDto) {
    return this.adminService.updateStore(tenant.store.id, dto);
  }

  /** 10. THEME MANAGEMENT */
  @Get('theme')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  getTheme(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getTheme(tenant.store.id);
  }

  @Patch('theme')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  updateTheme(@CurrentTenant() tenant: TenantContext, @Body() dto: UpdateThemeDto) {
    return this.adminService.updateTheme(tenant.store.id, dto);
  }

  /** 11. BRANDING MANAGEMENT */
  @Get('branding')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  getBranding(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getBranding(tenant.store.id);
  }

  @Patch('branding')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  updateBranding(@CurrentTenant() tenant: TenantContext, @Body() dto: UpdateBrandingDto) {
    return this.adminService.updateBranding(tenant.store.id, dto);
  }

  /** 12. HOMEPAGE CMS */
  @Get('homepage')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  getHomepage(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getHomepage(tenant.store.id);
  }

  @Patch('homepage')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  updateHomepage(@CurrentTenant() tenant: TenantContext, @Body() dto: UpdateHomepageDto) {
    return this.adminService.updateHomepage(tenant.store.id, dto);
  }

  @Get('homepage/sections')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  getHomepageSections(@CurrentTenant() tenant: TenantContext) {
    return this.adminService.getHomepageSections(tenant.store.id);
  }

  @Post('homepage/sections')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  createHomepageSection(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateHomepageSectionDto) {
    return this.adminService.createHomepageSection(tenant.store.id, dto);
  }

  @Patch('homepage/sections/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  updateHomepageSection(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateHomepageSectionDto,
  ) {
    return this.adminService.updateHomepageSection(tenant.store.id, id, dto);
  }

  @Delete('homepage/sections/:id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  deleteHomepageSection(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.adminService.deleteHomepageSection(tenant.store.id, id);
  }

  @Post('homepage/sections/reorder')
  @HttpCode(HttpStatus.OK)
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  reorderHomepageSections(@CurrentTenant() tenant: TenantContext, @Body() dto: ReorderHomepageSectionsDto) {
    return this.adminService.reorderHomepageSections(tenant.store.id, dto.sectionIds);
  }
}
