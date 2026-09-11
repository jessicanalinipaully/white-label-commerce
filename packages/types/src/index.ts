import { UserRole, StoreStatus, StoreUserRole } from '@commerce/database';

export { UserRole, StoreStatus, StoreUserRole };

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  domains?: StoreDomain[];
  users?: StoreUser[];
}

export interface StoreDomain {
  id: string;
  storeId: string;
  domain: string;
  isPrimary: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StoreUser {
  id: string;
  storeId: string;
  userId: string;
  role: StoreUserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: User;
  store?: Store;
}

export interface TenantContext {
  store: Store;
  domain: StoreDomain;
  membership?: StoreUser | null;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateStoreDto {
  name: string;
  slug: string;
  primaryDomain: string;
}

export interface AddDomainDto {
  domain: string;
  isPrimary?: boolean;
}

export interface AddStoreUserDto {
  userId: string;
  role?: StoreUserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: Omit<User, 'passwordHash'>;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}
