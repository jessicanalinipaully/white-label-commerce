import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { StoreModule } from './store/store.module';
import { TenantModule } from './tenant/tenant.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { StorefrontModule } from './storefront/storefront.module';
import { CustomerModule } from './customer/customer.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { TenantMiddleware } from './tenant/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    StoreModule,
    TenantModule,
    CategoryModule,
    ProductModule,
    InventoryModule,
    StorefrontModule,
    CustomerModule,
    CartModule,
    OrderModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
