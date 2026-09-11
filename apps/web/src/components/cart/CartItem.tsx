'use client';

import Image from 'next/image';
import { CartItem as CartItemType } from '@/lib/api/types';
import { useCart } from '@/context/CartContext';

export function CartItemRow({ item }: { item: CartItemType }) {
  const { update, remove } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-slate-800">
      {/* Image */}
      <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-800">
        {item.image ? (
          <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-2xl">🛍️</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-100 text-sm truncate">{item.productName}</p>
        <p className="text-xs text-slate-500 mt-0.5">{item.variantName}</p>
        <p className="text-xs font-mono text-slate-600">SKU: {item.sku}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Qty control */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => update(item.variantId, item.quantity - 1)}
              className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold text-slate-200">{item.quantity}</span>
            <button
              onClick={() => update(item.variantId, item.quantity + 1)}
              className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold transition-colors"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-100">
              ₹{(item.price * item.quantity).toFixed(2)}
            </span>
            <button
              onClick={() => remove(item.variantId)}
              className="text-slate-600 hover:text-red-400 transition-colors text-lg"
              aria-label="Remove item"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
