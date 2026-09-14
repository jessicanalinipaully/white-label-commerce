'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { WishlistItem } from '@/lib/api/types';
import {
  addToGuestWishlist,
  clearGuestWishlist,
  enrichGuestWishlist,
  getStoredGuestProductIds,
  getWishlist as getGuestWishlist,
  removeFromGuestWishlist,
} from '@/lib/wishlist/wishlistStore';
import {
  addServerWishlistItem,
  clearServerWishlist,
  fetchServerWishlist,
  mergeServerWishlist,
  moveServerWishlistItemToCart,
  removeServerWishlistItem,
} from '@/lib/api/wishlist';
import { getClientHost } from '@/lib/tenant';

interface WishlistContextValue {
  wishlist: WishlistItem[];
  count: number;
  add: (item: WishlistItem) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  inWishlist: (productId: string) => boolean;
  token: string | null;
  setToken: (newToken: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  isHydrated: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [token, setTokenState] = useState<string | null>(null);
  const [isServerMode, setIsServerMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const syncServerWishlist = useCallback(async (authToken: string) => {
    const host = getClientHost();
    const res = await fetchServerWishlist(authToken, host);
    if (res) {
      setWishlist(res.items);
      setIsServerMode(true);
    }
  }, []);

  // Hydrate from localStorage / server on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    const init = async () => {
      const storedToken = localStorage.getItem('wlc_token');
      const validToken =
        storedToken &&
        storedToken.trim().length > 0 &&
        storedToken !== 'undefined' &&
        storedToken !== 'null';

      if (validToken) {
        setTokenState(storedToken);
        const host = getClientHost();
        const res = await fetchServerWishlist(storedToken, host);
        if (isMounted) {
          if (res) {
            setWishlist(res.items);
            setIsServerMode(true);
          } else {
            // Token invalid or expired — fall back to guest wishlist
            setTokenState(null);
            setIsServerMode(false);
            setWishlist(getGuestWishlist());
          }
        }
      } else {
        setIsServerMode(false);
        const initialGuestItems = getGuestWishlist();
        if (isMounted) {
          setWishlist(initialGuestItems);
        }
        // Async enrichment for missing product details if any
        const host = getClientHost();
        const enriched = await enrichGuestWishlist(host);
        if (isMounted && enriched.length > 0) {
          setWishlist(enriched);
        }
      }
      if (isMounted) {
        setIsHydrated(true);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Set token (login / logout handler)
  const setToken = useCallback(
    async (newToken: string | null) => {
      const host = getClientHost();
      if (newToken) {
        setTokenState(newToken);
        const guestProductIds = getStoredGuestProductIds();
        if (guestProductIds.length > 0) {
          try {
            const merged = await mergeServerWishlist(newToken, guestProductIds, host);
            clearGuestWishlist();
            setWishlist(merged.items);
            setIsServerMode(true);
            return;
          } catch (err) {
            console.warn('Failed to merge wishlist on login:', err);
          }
        }
        const res = await fetchServerWishlist(newToken, host);
        if (res) {
          setWishlist(res.items);
          setIsServerMode(true);
        }
      } else {
        setTokenState(null);
        setIsServerMode(false);
        const guestItems = getGuestWishlist();
        setWishlist(guestItems);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);
    if (currentToken) {
      await syncServerWishlist(currentToken);
    } else {
      setWishlist(getGuestWishlist());
    }
  }, [token, syncServerWishlist]);

  const add = useCallback(
    async (item: WishlistItem) => {
      // Check if already in list
      if (wishlist.some((w) => w.productId === item.productId)) return;

      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);

      if (currentToken) {
        try {
          const host = getClientHost();
          setWishlist((prev) => [item, ...prev.filter((w) => w.productId !== item.productId)]);
          const res = await addServerWishlistItem(currentToken, item.productId, host);
          if (res?.items) setWishlist(res.items);
        } catch (err) {
          await refresh();
          throw err;
        }
      } else {
        const updated = addToGuestWishlist(item);
        setWishlist(updated);
      }
    },
    [token, wishlist, refresh],
  );

  const remove = useCallback(
    async (productId: string) => {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);

      if (currentToken) {
        try {
          setWishlist((prev) => prev.filter((w) => w.productId !== productId));
          const host = getClientHost();
          const res = await removeServerWishlistItem(currentToken, productId, host);
          if (res?.items) setWishlist(res.items);
        } catch (err) {
          await refresh();
          throw err;
        }
      } else {
        const updated = removeFromGuestWishlist(productId);
        setWishlist(updated);
      }
    },
    [token, refresh],
  );

  const clear = useCallback(async () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);

    if (currentToken) {
      try {
        setWishlist([]);
        const host = getClientHost();
        const res = await clearServerWishlist(currentToken, host);
        if (res?.items) setWishlist(res.items);
      } catch (err) {
        await refresh();
        throw err;
      }
    } else {
      clearGuestWishlist();
      setWishlist([]);
    }
  }, [token, refresh]);

  const moveToCart = useCallback(
    async (productId: string) => {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);

      if (currentToken) {
        const host = getClientHost();
        const res = await moveServerWishlistItemToCart(currentToken, productId, host);
        if (res?.items) setWishlist(res.items);
      } else {
        const updated = removeFromGuestWishlist(productId);
        setWishlist(updated);
      }
    },
    [token],
  );

  const inWishlist = useCallback(
    (productId: string) => wishlist.some((w) => w.productId === productId),
    [wishlist],
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        count: wishlist.length,
        add,
        remove,
        clear,
        moveToCart,
        inWishlist,
        token,
        setToken,
        refresh,
        isHydrated,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

