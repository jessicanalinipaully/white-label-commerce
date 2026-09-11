import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { TenantContext } from '@commerce/types';
import { CustomerService } from './customer.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('me')
  getProfile(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any): Promise<any> {
    return this.customerService.getOrCreateCustomer(tenant.store.id, user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: UpdateCustomerDto,
  ): Promise<any> {
    return this.customerService.updateCustomer(tenant.store.id, user.id, dto);
  }

  @Get('me/addresses')
  getAddresses(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any): Promise<any[]> {
    return this.customerService.getAddresses(tenant.store.id, user.id);
  }

  @Post('me/addresses')
  createAddress(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: CreateAddressDto,
  ): Promise<any> {
    return this.customerService.createAddress(tenant.store.id, user.id, dto);
  }

  @Patch('me/addresses/:id')
  updateAddress(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<any> {
    return this.customerService.updateAddress(tenant.store.id, user.id, id, dto);
  }

  @Delete('me/addresses/:id')
  @HttpCode(200)
  deleteAddress(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    return this.customerService.deleteAddress(tenant.store.id, user.id, id);
  }
}
