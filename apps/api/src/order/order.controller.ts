import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { PaginatedResult, TenantContext } from '@commerce/types';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  checkout(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: CheckoutDto,
  ): Promise<any> {
    return this.orderService.checkout(tenant.store.id, user.id, dto);
  }

  @Get('orders')
  getOrders(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<any>> {
    return this.orderService.getCustomerOrders(tenant.store.id, user.id, page, limit);
  }

  @Get('orders/:id')
  getOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<any> {
    return this.orderService.getCustomerOrderById(tenant.store.id, user.id, id);
  }
}
