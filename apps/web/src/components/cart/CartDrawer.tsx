'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartItemRow } from './CartItem';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, count, subtotal, clear } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🛒 Shopping Cart</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-6 divide-y divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="text-5xl">🛍️</div>
                <p className="text-slate-400 font-medium">Your cart is empty</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-sm font-semibold transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => <CartItemRow key={item.variantId} item={item} />)
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-4">
              <div className="flex items-center justify-between text-base font-semibold">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-xl font-bold text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500">Shipping and taxes calculated at checkout.</p>
              
              <div className="space-y-2">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block w-full py-3 text-center rounded-xl bg-primary hover:bg-primary-hover font-bold transition-colors shadow-lg shadow-primary/30"
                >
                  View Full Cart & Checkout
                </Link>
                <button
                  onClick={() => {
                    clear();
                  }}
                  className="block w-full py-2 text-center text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
