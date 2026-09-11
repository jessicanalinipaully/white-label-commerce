import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';

@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(private readonly storeService: StoreService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Ensure TenantContext was resolved by domain
    if (!request.tenant || !request.tenant.store) {
      throw new NotFoundException('Store not found for requested domain');
    }

    // 2. Ensure User is authenticated (JwtAuthGuard should run before this)
    if (!request.user || !request.user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // 3. Verify user membership in the resolved store
    const storeId = request.tenant.store.id;
    const userId = request.user.id;

    const membership = await this.storeService.verifyUserBelongsToStore(storeId, userId);

    if (!membership) {
      throw new ForbiddenException('User is not a member of this store');
    }

    // 4. Attach membership role to request tenant context
    request.tenant.membership = membership;

    return true;
  }
}
