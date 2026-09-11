'use client';

import { WishlistItem } from '../api/types';

const WISHLIST_KEY = 'wlc_wishlist';

export function getWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWishlist(items: WishlistItem[]): void {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function addToWishlist(item: WishlistItem): WishlistItem[] {
  const list = getWishlist();
  if (!list.find((w) => w.productId === item.productId)) {
    list.push(item);
    saveWishlist(list);
  }
  return list;
}

export function removeFromWishlist(productId: string): WishlistItem[] {
  const list = getWishlist().filter((w) => w.productId !== productId);
  saveWishlist(list);
  return list;
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().some((w) => w.productId === productId);
}

export function clearWishlist(): WishlistItem[] {
  saveWishlist([]);
  return [];
}
