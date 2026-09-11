import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StoreRoleGuard } from './guards/store-role.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, StoreRoleGuard],
  exports: [AdminService],
})
export class AdminModule {}
