'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { WishlistItem } from '@/lib/api/types';
import {
  addToWishlist,
  clearWishlist,
  getWishlist,
  isInWishlist,
  removeFromWishlist,
} from '@/lib/wishlist/wishlistStore';

interface WishlistContextValue {
  wishlist: WishlistItem[];
  count: number;
  add: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
  inWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setWishlist(getWishlist());
  }, []);

  const add = useCallback((item: WishlistItem) => setWishlist(addToWishlist(item)), []);
  const remove = useCallback((productId: string) => setWishlist(removeFromWishlist(productId)), []);
  const clear = useCallback(() => setWishlist(clearWishlist()), []);
  const inWishlist = useCallback((productId: string) => isInWishlist(productId), []);

  return (
    <WishlistContext.Provider value={{ wishlist, count: wishlist.length, add, remove, clear, inWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
