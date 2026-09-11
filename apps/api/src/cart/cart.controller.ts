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
import { CartService } from './cart.service';
import { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any): Promise<any> {
    return this.cartService.getCartDetails(tenant.store.id, user.id);
  }

  @Post('items')
  addItem(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: AddCartItemDto,
  ): Promise<any> {
    return this.cartService.addItem(tenant.store.id, user.id, dto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<any> {
    return this.cartService.updateItem(tenant.store.id, user.id, id, dto.quantity);
  }

  @Delete('items/:id')
  @HttpCode(200)
  removeItem(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    return this.cartService.removeItem(tenant.store.id, user.id, id);
  }

  @Delete()
  @HttpCode(200)
  clearCart(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: any): Promise<any> {
    return this.cartService.clearCart(tenant.store.id, user.id);
  }

  @Post('merge')
  @HttpCode(200)
  mergeCart(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: MergeCartDto,
  ): Promise<any> {
    return this.cartService.mergeLocalCart(tenant.store.id, user.id, dto.items || []);
  }
}
