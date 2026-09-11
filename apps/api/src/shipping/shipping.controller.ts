import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { TenantContext } from '@commerce/types';
import { ShippingService } from './shipping.service';
import { SelectShippingRateDto } from './dto/shipping.dto';

@Controller()
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  /** Public tenant-scoped shipping rates endpoint */
  @Get('shipping/rates')
  getRates(@Req() req: Request): Promise<any[]> {
    if (!req.tenant?.store?.id) {
      throw new NotFoundException('Store not found for requested domain');
    }
    return this.shippingService.getPublicRates(req.tenant.store.id);
  }

  /** Customer attach shipping rate to order endpoint */
  @Post('orders/:orderId/shipping')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  attachShippingRate(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: SelectShippingRateDto,
  ): Promise<any> {
    return this.shippingService.attachShippingRateToOrder(
      tenant.store.id,
      user.id,
      orderId,
      dto.shippingRateId,
    );
  }
}
