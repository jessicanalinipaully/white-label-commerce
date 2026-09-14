import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { TenantContext } from '@commerce/types';
import { WishlistService } from './wishlist.service';
import { MergeWishlistDto } from './dto/wishlist.dto';

@Controller('customer/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.wishlistService.getWishlistDetails(tenant.store.id, user.id);
  }

  @Post('merge')
  @HttpCode(200)
  mergeWishlist(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: MergeWishlistDto,
  ): Promise<any> {
    return this.wishlistService.mergeWishlist(
      tenant.store.id,
      user.id,
      dto.productIds || [],
    );
  }

  @Post(':productId/move-to-cart')
  @HttpCode(200)
  moveToCart(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ): Promise<any> {
    return this.wishlistService.moveToCart(tenant.store.id, user.id, productId);
  }

  @Post(':productId')
  addWishlistItem(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ): Promise<any> {
    return this.wishlistService.addWishlistItem(tenant.store.id, user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(200)
  removeWishlistItem(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ): Promise<any> {
    return this.wishlistService.removeWishlistItem(tenant.store.id, user.id, productId);
  }

  @Delete()
  @HttpCode(200)
  clearWishlist(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.wishlistService.clearWishlist(tenant.store.id, user.id);
  }
}
