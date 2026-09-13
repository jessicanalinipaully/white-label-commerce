'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartItemRow } from '@/components/cart/CartItem';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CartPage() {
  const { cart, count, subtotal, clear } = useCart();

  if (cart.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Looks like you haven't added anything to your cart yet."
        icon="🛒"
        actionLabel="Explore Catalog"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-slate-400 mt-1">{count} items selected</p>
        </div>
        <button
          onClick={clear}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart List */}
        <div className="lg:col-span-2 space-y-4 rounded-2xl bg-slate-900 border border-slate-800 p-6 divide-y divide-slate-800">
          {cart.map((item) => (
            <CartItemRow key={item.variantId} item={item} />
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 sticky top-24">
          <h2 className="text-lg font-bold text-white">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping</span>
              <span className="text-emerald-400 font-semibold">Calculated at checkout</span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-bold text-white">
              <span>Estimated Total</span>
              <span className="text-primary">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="block w-full py-4 rounded-xl bg-primary hover:bg-primary-hover font-bold text-white transition-all shadow-lg shadow-primary/30 text-center"
          >
            Proceed to Checkout →
          </Link>

          <p className="text-xs text-center text-slate-500">
            🔒 Secure multi-tenant local cart state
          </p>
        </div>
      </div>
    </div>
  );
}
