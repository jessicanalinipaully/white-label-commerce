import { StoreInfo, Category, Product, PaginatedResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/** Build headers that pass the current host to the backend for tenant resolution. */
function buildHeaders(host?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (host) {
    headers['X-Forwarded-Host'] = host;
  }
  return headers;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export async function fetchStoreInfo(host?: string): Promise<StoreInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/storefront/store`, {
      headers: buildHeaders(host),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCategories(host?: string): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/storefront/categories`, {
      headers: buildHeaders(host),
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchProducts(
  query: ProductQuery = {},
  host?: string,
): Promise<PaginatedResult<Product>> {
  const qs = buildQueryString({
    page: query.page,
    limit: query.limit,
    q: query.q,
    categoryId: query.categoryId,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sortBy: query.sortBy,
  });
  const res = await fetch(`${API_BASE}/storefront/products${qs}`, {
    headers: buildHeaders(host),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProductBySlug(slug: string, host?: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/storefront/products/${encodeURIComponent(slug)}`, {
      headers: buildHeaders(host),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCategoryProducts(
  categorySlug: string,
  query: ProductQuery = {},
  host?: string,
): Promise<{ category: Category; products: PaginatedResult<Product> } | null> {
  const qs = buildQueryString({
    page: query.page,
    limit: query.limit,
    q: query.q,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sortBy: query.sortBy,
  });
  try {
    const res = await fetch(
      `${API_BASE}/storefront/category/${encodeURIComponent(categorySlug)}${qs}`,
      {
        headers: buildHeaders(host),
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
