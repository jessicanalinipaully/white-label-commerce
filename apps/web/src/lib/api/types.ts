// Storefront API types — mirrors backend response shapes

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  domains: { domain: string; isPrimary: boolean }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface InventoryInfo {
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: string | number | null;
  attributes: Record<string, string>;
  isActive: boolean;
  inventory: InventoryInfo | null;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string | null;
  price: string | number;
  compareAtPrice: string | number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  _count?: { products: number };
}

export interface FilterOptions {
  categories: FilterCategory[];
  availableSizes: string[];
  availableColors: string[];
  priceBounds: { min: number; max: number };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filterOptions?: FilterOptions;
}

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface WishlistItem {
  id?: string;
  wishlistId?: string;
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
  isAvailable?: boolean;
  categoryName?: string | null;
  createdAt?: string;
}

export interface WishlistResponse {
  id: string;
  storeId: string;
  customerId: string;
  items: WishlistItem[];
  totalItems: number;
}
