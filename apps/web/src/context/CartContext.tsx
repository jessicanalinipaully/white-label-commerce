'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CartItem } from '@/lib/api/types';
import {
  addToCart,
  clearCart,
  getCart,
  getCartCount,
  getCartSubtotal,
  removeFromCart,
  updateCartQuantity,
} from '@/lib/cart/cartStore';

interface CartContextValue {
  cart: CartItem[];
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  remove: (variantId: string) => void;
  update: (variantId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const add = useCallback((item: CartItem) => setCart(addToCart(item)), []);
  const remove = useCallback((variantId: string) => setCart(removeFromCart(variantId)), []);
  const update = useCallback(
    (variantId: string, quantity: number) => setCart(updateCartQuantity(variantId, quantity)),
    [],
  );
  const clear = useCallback(() => setCart(clearCart()), []);

  return (
    <CartContext.Provider
      value={{ cart, count: getCartCount(cart), subtotal: getCartSubtotal(cart), add, remove, update, clear }}
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
