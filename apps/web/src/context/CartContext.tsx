'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CartItem } from '@/lib/api/types';
import {
  addToCart as addLocal,
  clearCart as clearLocal,
  getCart as getLocal,
  removeFromCart as removeLocal,
  updateCartQuantity as updateLocal,
} from '@/lib/cart/cartStore';
import {
  addServerCartItem,
  clearServerCart,
  fetchServerCart,
  mergeServerCart,
  removeServerCartItem,
  updateServerCartItem,
} from '@/lib/api/cart';
import { getClientHost } from '@/lib/tenant';

interface CartContextValue {
  cart: CartItem[];
  count: number;
  subtotal: number;
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  add: (item: CartItem) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  update: (variantId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [token, setTokenState] = useState<string | null>(null);
  const [isServerMode, setIsServerMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const syncServerCart = useCallback(async (authToken: string) => {
    const host = getClientHost();
    const serverCart = await fetchServerCart(authToken, host);
    if (serverCart) {
      const items: CartItem[] = serverCart.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productSlug: i.productSlug,
        variantId: i.variantId,
        variantName: i.variantName,
        sku: i.sku,
        price: i.unitPrice,
        quantity: i.quantity,
        image: i.image,
      }));
      setCart(items);
      setIsServerMode(true);
      return true;
    }
    return false;
  }, []);

  // Hydrate cart from localStorage or server on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    const init = async () => {
      const savedToken = localStorage.getItem('wlc_token');
      const validToken =
        savedToken &&
        savedToken.trim().length > 0 &&
        savedToken !== 'undefined' &&
        savedToken !== 'null';

      if (validToken) {
        setTokenState(savedToken);
        const host = getClientHost();
        const serverCart = await fetchServerCart(savedToken, host);
        if (isMounted) {
          if (serverCart) {
            const items: CartItem[] = serverCart.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              productSlug: i.productSlug,
              variantId: i.variantId,
              variantName: i.variantName,
              sku: i.sku,
              price: i.unitPrice,
              quantity: i.quantity,
              image: i.image,
            }));
            setCart(items);
            setIsServerMode(true);
          } else {
            // Token invalid or expired — fall back to guest cart
            localStorage.removeItem('wlc_token');
            setTokenState(null);
            setIsServerMode(false);
            setCart(getLocal());
          }
        }
      } else {
        setIsServerMode(false);
        if (isMounted) {
          setCart(getLocal());
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

  // When token changes / log in occurs: merge local cart into server cart
  const setToken = useCallback(
    async (newToken: string | null) => {
      const host = getClientHost();
      if (newToken) {
        localStorage.setItem('wlc_token', newToken);
        setTokenState(newToken);

        const localItems = getLocal();
        if (localItems.length > 0) {
          try {
            await mergeServerCart(
              newToken,
              localItems.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
              host,
            );
            clearLocal();
          } catch {
            // fallback
          }
        }
        await syncServerCart(newToken);
      } else {
        localStorage.removeItem('wlc_token');
        setTokenState(null);
        setIsServerMode(false);
        setCart(getLocal());
      }
    },
    [syncServerCart],
  );

  const refresh = useCallback(async () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);
    if (currentToken) {
      await syncServerCart(currentToken);
    } else {
      setCart(getLocal());
    }
  }, [token, syncServerCart]);

  const add = useCallback(
    async (item: CartItem) => {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);
      if (currentToken) {
        const host = getClientHost();
        await addServerCartItem(
          currentToken,
          { productId: item.productId, variantId: item.variantId, quantity: item.quantity },
          host,
        );
        await syncServerCart(currentToken);
      } else {
        setCart(addLocal(item));
      }
    },
    [token, syncServerCart],
  );

  const remove = useCallback(
    async (variantId: string) => {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);
      if (currentToken) {
        const host = getClientHost();
        const serverCart = await fetchServerCart(currentToken, host);
        const target = serverCart?.items.find((i) => i.variantId === variantId);
        if (target) {
          await removeServerCartItem(currentToken, target.id, host);
        }
        await syncServerCart(currentToken);
      } else {
        setCart(removeLocal(variantId));
      }
    },
    [token, syncServerCart],
  );

  const update = useCallback(
    async (variantId: string, quantity: number) => {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);
      if (currentToken) {
        const host = getClientHost();
        const serverCart = await fetchServerCart(currentToken, host);
        const target = serverCart?.items.find((i) => i.variantId === variantId);
        if (target) {
          await updateServerCartItem(currentToken, target.id, quantity, host);
        }
        await syncServerCart(currentToken);
      } else {
        setCart(updateLocal(variantId, quantity));
      }
    },
    [token, syncServerCart],
  );

  const clear = useCallback(async () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wlc_token') : null);
    if (currentToken) {
      const host = getClientHost();
      await clearServerCart(currentToken, host);
      await syncServerCart(currentToken);
    } else {
      setCart(clearLocal());
    }
  }, [token, syncServerCart]);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, count, subtotal, token, setToken, add, remove, update, clear, refresh, isHydrated }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

