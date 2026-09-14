import { WishlistResponse } from './types';

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

export async function fetchServerWishlist(token: string, host?: string): Promise<WishlistResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/customer/wishlist`, {
      headers: getAuthHeaders(token, host),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function addServerWishlistItem(token: string, productId: string, host?: string): Promise<WishlistResponse> {
  const res = await fetch(`${API_BASE}/customer/wishlist/${productId}`, {
    method: 'POST',
    headers: getAuthHeaders(token, host),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add item to wishlist');
  }
  return res.json();
}

export async function removeServerWishlistItem(token: string, productId: string, host?: string): Promise<WishlistResponse> {
  const res = await fetch(`${API_BASE}/customer/wishlist/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token, host),
  });
  if (!res.ok) throw new Error('Failed to remove wishlist item');
  return res.json();
}

export async function clearServerWishlist(token: string, host?: string): Promise<WishlistResponse> {
  const res = await fetch(`${API_BASE}/customer/wishlist`, {
    method: 'DELETE',
    headers: getAuthHeaders(token, host),
  });
  if (!res.ok) throw new Error('Failed to clear wishlist');
  return res.json();
}

export async function mergeServerWishlist(
  token: string,
  productIds: string[],
  host?: string,
): Promise<WishlistResponse> {
  const res = await fetch(`${API_BASE}/customer/wishlist/merge`, {
    method: 'POST',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify({ productIds }),
  });
  if (!res.ok) throw new Error('Failed to merge wishlist');
  return res.json();
}

export async function moveServerWishlistItemToCart(token: string, productId: string, host?: string): Promise<WishlistResponse> {
  const res = await fetch(`${API_BASE}/customer/wishlist/${productId}/move-to-cart`, {
    method: 'POST',
    headers: getAuthHeaders(token, host),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to move item to cart');
  }
  return res.json();
}
