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
  setToken: (token: string | null) => void;
  add: (item: CartItem) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  update: (variantId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [token, setTokenState] = useState<string | null>(null);
  const [isServerMode, setIsServerMode] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('wlc_token');
    if (savedToken) {
      setTokenState(savedToken);
    } else {
      setCart(getLocal());
    }
  }, []);

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
    }
  }, []);

  // When token changes / log in occurs: merge local cart into server cart
  const setToken = useCallback(
    async (newToken: string | null) => {
      if (newToken) {
        localStorage.setItem('wlc_token', newToken);
        setTokenState(newToken);

        const localItems = getLocal();
        if (localItems.length > 0) {
          try {
            const host = getClientHost();
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
    if (token) {
      await syncServerCart(token);
    } else {
      setCart(getLocal());
    }
  }, [token, syncServerCart]);

  const add = useCallback(
    async (item: CartItem) => {
      if (token) {
        const host = getClientHost();
        await addServerCartItem(
          token,
          { productId: item.productId, variantId: item.variantId, quantity: item.quantity },
          host,
        );
        await syncServerCart(token);
      } else {
        setCart(addLocal(item));
      }
    },
    [token, syncServerCart],
  );

  const remove = useCallback(
    async (variantId: string) => {
      if (token) {
        const host = getClientHost();
        const serverCart = await fetchServerCart(token, host);
        const target = serverCart?.items.find((i) => i.variantId === variantId);
        if (target) {
          await removeServerCartItem(token, target.id, host);
        }
        await syncServerCart(token);
      } else {
        setCart(removeLocal(variantId));
      }
    },
    [token, syncServerCart],
  );

  const update = useCallback(
    async (variantId: string, quantity: number) => {
      if (token) {
        const host = getClientHost();
        const serverCart = await fetchServerCart(token, host);
        const target = serverCart?.items.find((i) => i.variantId === variantId);
        if (target) {
          await updateServerCartItem(token, target.id, quantity, host);
        }
        await syncServerCart(token);
      } else {
        setCart(updateLocal(variantId, quantity));
      }
    },
    [token, syncServerCart],
  );

  const clear = useCallback(async () => {
    if (token) {
      const host = getClientHost();
      await clearServerCart(token, host);
      await syncServerCart(token);
    } else {
      setCart(clearLocal());
    }
  }, [token, syncServerCart]);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, count, subtotal, token, setToken, add, remove, update, clear, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
