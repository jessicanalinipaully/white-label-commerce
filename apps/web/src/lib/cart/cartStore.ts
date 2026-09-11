'use client';

import { CartItem } from '../api/types';

const CART_KEY = 'wlc_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  const idx = cart.findIndex((c) => c.variantId === item.variantId);
  if (idx >= 0) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(variantId: string): CartItem[] {
  const cart = getCart().filter((c) => c.variantId !== variantId);
  saveCart(cart);
  return cart;
}

export function updateCartQuantity(variantId: string, quantity: number): CartItem[] {
  const cart = getCart();
  const idx = cart.findIndex((c) => c.variantId === variantId);
  if (idx >= 0) {
    if (quantity <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity = quantity;
    }
  }
  saveCart(cart);
  return cart;
}

export function clearCart(): CartItem[] {
  saveCart([]);
  return [];
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
