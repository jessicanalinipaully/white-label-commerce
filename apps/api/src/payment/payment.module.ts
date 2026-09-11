import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { MockPaymentProvider } from './providers/mock.provider';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [CustomerModule],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayProvider, MockPaymentProvider],
  exports: [PaymentService, RazorpayProvider, MockPaymentProvider],
})
export class PaymentModule {}
