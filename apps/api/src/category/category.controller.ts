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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAuthGuard } from '../tenant/tenant-auth.guard';
import { StoreRolesGuard } from '../common/guards/store-roles.guard';
import { StoreRoles } from '../common/decorators/store-roles.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { StoreUserRole, TenantContext } from '@commerce/types';

@Controller('categories')
@UseGuards(JwtAuthGuard, TenantAuthGuard, StoreRolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(tenant.store.id, dto);
  }

  @Get()
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.INVENTORY_MANAGER,
    StoreUserRole.SUPPORT_AGENT,
  )
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.categoryService.findAll(tenant.store.id, page, limit);
  }

  @Get(':id')
  @StoreRoles(
    StoreUserRole.OWNER,
    StoreUserRole.ADMIN,
    StoreUserRole.MANAGER,
    StoreUserRole.INVENTORY_MANAGER,
    StoreUserRole.SUPPORT_AGENT,
  )
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.categoryService.findOne(tenant.store.id, id);
  }

  @Patch(':id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(tenant.store.id, id, dto);
  }

  @Delete(':id')
  @StoreRoles(StoreUserRole.OWNER, StoreUserRole.ADMIN, StoreUserRole.MANAGER)
  remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.categoryService.remove(tenant.store.id, id);
  }
}
