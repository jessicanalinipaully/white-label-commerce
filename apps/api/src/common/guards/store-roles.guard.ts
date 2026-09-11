import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StoreUserRole } from '@commerce/types';
import { STORE_ROLES_KEY } from '../decorators/store-roles.decorator';

@Injectable()
export class StoreRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<StoreUserRole[]>(STORE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const membership = request.tenant?.membership;

    if (!membership || !membership.role) {
      throw new ForbiddenException('User membership role is missing');
    }

    const hasRole = requiredRoles.includes(membership.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `User role ${membership.role} does not have required permissions for this action`,
      );
    }

    return true;
  }
}
