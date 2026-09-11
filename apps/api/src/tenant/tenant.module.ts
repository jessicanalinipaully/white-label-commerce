import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantAuthGuard } from './tenant-auth.guard';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [StoreModule],
  controllers: [TenantController],
  providers: [TenantAuthGuard],
  exports: [TenantAuthGuard],
})
export class TenantModule {}
