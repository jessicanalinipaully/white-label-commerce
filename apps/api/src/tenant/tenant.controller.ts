import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAuthGuard } from './tenant-auth.guard';
import { CurrentTenant } from './tenant.decorator';
import { TenantContext } from '@commerce/types';

@Controller('tenant')
export class TenantController {
  @UseGuards(JwtAuthGuard, TenantAuthGuard)
  @Get()
  getTenantContext(@CurrentTenant() tenant: TenantContext) {
    return {
      store: {
        id: tenant.store.id,
        name: tenant.store.name,
        slug: tenant.store.slug,
        status: tenant.store.status,
      },
      domain: {
        id: tenant.domain.id,
        domain: tenant.domain.domain,
        isPrimary: tenant.domain.isPrimary,
      },
      membership: tenant.membership
        ? {
            id: tenant.membership.id,
            role: tenant.membership.role,
            createdAt: tenant.membership.createdAt,
          }
        : null,
    };
  }
}
