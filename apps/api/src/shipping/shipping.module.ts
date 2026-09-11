import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { DevelopmentShippingProvider } from './providers/development.provider';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [CustomerModule],
  controllers: [ShippingController],
  providers: [ShippingService, DevelopmentShippingProvider],
  exports: [ShippingService, DevelopmentShippingProvider],
})
export class ShippingModule {}
