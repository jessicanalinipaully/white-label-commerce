import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { TenantContext } from '@commerce/types';
import { PaymentService } from './payment.service';
import { VerifyPaymentDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders/:orderId/create')
  @UseGuards(JwtAuthGuard)
  createPaymentOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ): Promise<any> {
    return this.paymentService.createPaymentOrder(tenant.store.id, user.id, orderId);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  verifyPayment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() dto: VerifyPaymentDto,
  ): Promise<any> {
    return this.paymentService.verifyPayment(tenant.store.id, user.id, dto);
  }

  @Post('webhook/razorpay')
  @HttpCode(200)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any,
  ): Promise<any> {
    const rawBody = req.rawBody || JSON.stringify(payload);
    return this.paymentService.handleRazorpayWebhook(rawBody, signature || '', payload);
  }
}
