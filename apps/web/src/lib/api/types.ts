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

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  image: string | null;
}
