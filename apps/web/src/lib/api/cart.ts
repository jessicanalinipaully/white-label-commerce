const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeaders(token: string, host?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (host) {
    headers['X-Forwarded-Host'] = host;
  }
  return headers;
}

export interface ServerCartItem {
  id: string;
  cartId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  lineTotal: number;
  quantity: number;
  isAvailable: boolean;
  availableStock: number;
  image: string | null;
}

export interface ServerCart {
  id: string;
  storeId: string;
  customerId: string;
  status: string;
  items: ServerCartItem[];
  totalItems: number;
  subtotal: number;
}

export async function fetchServerCart(token: string, host?: string): Promise<ServerCart | null> {
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: getAuthHeaders(token, host),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function addServerCartItem(
  token: string,
  data: { productId: string; variantId: string; quantity: number },
  host?: string,
): Promise<ServerCart> {
  const res = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add item to cart');
  }
  return res.json();
}

export async function updateServerCartItem(
  token: string,
  itemId: string,
  quantity: number,
  host?: string,
): Promise<ServerCart> {
  const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart item');
  return res.json();
}

export async function removeServerCartItem(token: string, itemId: string, host?: string): Promise<ServerCart> {
  const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token, host),
  });
  if (!res.ok) throw new Error('Failed to remove cart item');
  return res.json();
}

export async function clearServerCart(token: string, host?: string): Promise<ServerCart> {
  const res = await fetch(`${API_BASE}/cart`, {
    method: 'DELETE',
    headers: getAuthHeaders(token, host),
  });
  if (!res.ok) throw new Error('Failed to clear cart');
  return res.json();
}

export async function mergeServerCart(
  token: string,
  items: { productId: string; variantId: string; quantity: number }[],
  host?: string,
): Promise<ServerCart> {
  const res = await fetch(`${API_BASE}/cart/merge`, {
    method: 'POST',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to merge cart');
  return res.json();
}
