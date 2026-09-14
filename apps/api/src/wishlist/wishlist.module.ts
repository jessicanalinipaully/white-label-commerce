import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CustomerModule } from '../customer/customer.module';
import { CartModule } from '../cart/cart.module';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [DatabaseModule, CustomerModule, CartModule],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
