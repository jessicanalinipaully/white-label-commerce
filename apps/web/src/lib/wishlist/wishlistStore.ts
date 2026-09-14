'use client';

import { WishlistItem } from '../api/types';
import { fetchProducts } from '../api/storefront';

const WISHLIST_KEY = 'wlc_wishlist';
const WISHLIST_ITEMS_KEY = 'wlc_wishlist_items';

/** Safely retrieve unique guest product IDs from localStorage ("wlc_wishlist") */
export function getStoredGuestProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids = parsed
      .map((item) => (typeof item === 'string' ? item : item?.productId))
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    return Array.from(new Set(ids));
  } catch {
    return [];
  }
}

/** Safely retrieve cached guest wishlist items from localStorage ("wlc_wishlist_items") */
export function getStoredGuestItems(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.productId === 'string');
  } catch {
    return [];
  }
}

/** Persist guest wishlist to localStorage (wlc_wishlist = string[], wlc_wishlist_items = WishlistItem[]) */
export function saveGuestWishlist(items: WishlistItem[]): void {
  if (typeof window === 'undefined') return;
  const uniqueItems: WishlistItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (item && item.productId && !seen.has(item.productId)) {
      seen.add(item.productId);
      uniqueItems.push(item);
    }
  }
  const productIds = uniqueItems.map((i) => i.productId);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(productIds));
  localStorage.setItem(WISHLIST_ITEMS_KEY, JSON.stringify(uniqueItems));
}

/** Clear guest wishlist from localStorage */
export function clearGuestWishlist(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WISHLIST_KEY);
  localStorage.removeItem(WISHLIST_ITEMS_KEY);
}

/** Add an item to guest wishlist */
export function addToGuestWishlist(item: WishlistItem): WishlistItem[] {
  const current = getStoredGuestItems();
  const updated = [item, ...current.filter((i) => i.productId !== item.productId)];
  saveGuestWishlist(updated);
  return updated;
}

/** Remove an item from guest wishlist by product ID */
export function removeFromGuestWishlist(productId: string): WishlistItem[] {
  const current = getStoredGuestItems();
  const updated = current.filter((i) => i.productId !== productId);
  saveGuestWishlist(updated);
  return updated;
}

/** Synchronously hydrate guest wishlist from localStorage */
export function getWishlist(): WishlistItem[] {
  const productIds = getStoredGuestProductIds();
  if (productIds.length === 0) return [];

  const cachedItems = getStoredGuestItems();
  const itemMap = new Map<string, WishlistItem>();
  for (const item of cachedItems) {
    itemMap.set(item.productId, item);
  }

  const result: WishlistItem[] = [];
  for (const id of productIds) {
    if (itemMap.has(id)) {
      result.push(itemMap.get(id)!);
    } else {
      result.push({
        productId: id,
        productName: 'Saved Product',
        productSlug: id,
        price: 0,
        image: null,
      });
    }
  }

  return result;
}

/** Async enrichment helper to fetch missing product details for guest product IDs without losing item state */
export async function enrichGuestWishlist(host?: string): Promise<WishlistItem[]> {
  const productIds = getStoredGuestProductIds();
  if (productIds.length === 0) return [];

  const cachedItems = getStoredGuestItems();
  const missingIds = productIds.filter((id) => !cachedItems.some((i) => i.productId === id));

  if (missingIds.length === 0) {
    return getWishlist();
  }

  try {
    const res = await fetchProducts({ limit: 100 }, host);
    if (res?.data) {
      const updatedMap = new Map<string, WishlistItem>();
      for (const item of cachedItems) {
        updatedMap.set(item.productId, item);
      }
      for (const p of res.data) {
        if (missingIds.includes(p.id)) {
          updatedMap.set(p.id, {
            productId: p.id,
            productName: p.name,
            productSlug: p.slug,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            image: p.images?.[0]?.url ?? null,
            isAvailable: p.isActive,
            categoryName: p.category?.name ?? null,
          });
        }
      }
      const updatedList = productIds.map(
        (id) =>
          updatedMap.get(id) ?? {
            productId: id,
            productName: 'Saved Product',
            productSlug: id,
            price: 0,
            image: null,
          },
      );
      saveGuestWishlist(updatedList);
      return updatedList;
    }
  } catch {
    // Return existing stubbed list on fetch failure
  }

  return getWishlist();
}


