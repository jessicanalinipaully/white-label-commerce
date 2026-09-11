import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StoreUserRole } from '@commerce/types';
import { STORE_ROLES_KEY } from '../decorators/store-roles.decorator';

@Injectable()
export class StoreRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<StoreUserRole[]>(
      STORE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!request.tenant || !request.tenant.membership) {
      throw new ForbiddenException('User membership role could not be determined');
    }

    const userRole: StoreUserRole = request.tenant.membership.role;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(`Role ${userRole} is not authorized to perform this operation`);
    }

    return true;
  }
}
