import { SetMetadata } from '@nestjs/common';
import { StoreUserRole } from '@commerce/types';

export const STORE_ROLES_KEY = 'store_roles';
export const StoreRoles = (...roles: StoreUserRole[]) => SetMetadata(STORE_ROLES_KEY, roles);
