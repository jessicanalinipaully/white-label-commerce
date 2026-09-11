import { UserRole, StoreStatus, StoreUserRole, CartStatus, OrderStatus, PaymentStatus, OrderPaymentStatus, HomepageSectionType } from '@commerce/database';

export { UserRole, StoreStatus, StoreUserRole, CartStatus, OrderStatus, PaymentStatus, OrderPaymentStatus, HomepageSectionType };

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

export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductVariant {
  id: string;
  storeId: string;
  productId: string;
  name: string;
  sku: string;
  price?: number | string | null;
  attributes: Record<string, any>;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  inventory?: Inventory | null;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  sku?: string | null;
  price: number | string;
  compareAtPrice?: number | string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface Inventory {
  id: string;
  storeId: string;
  variantId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  createdAt: Date | string;
  updatedAt: Date | string;
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

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StoreTheme {
  id: string;
  storeId: string;
  name: string;
  isActive: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
  buttonStyle: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StoreBranding {
  id: string;
  storeId: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  storeDisplayName?: string | null;
  tagline?: string | null;
  socialPreviewImageUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StoreHomepage {
  id: string;
  storeId: string;
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  sections?: StoreHomepageSection[];
}

export interface StoreHomepageSection {
  id: string;
  homepageId: string;
  type: HomepageSectionType;
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  product?: Product | null;
  category?: Category | null;
}

export interface StorefrontConfig {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  branding: StoreBranding | null;
  theme: StoreTheme | null;
  homepage: StoreHomepage | null;
  sections: StoreHomepageSection[];
}

