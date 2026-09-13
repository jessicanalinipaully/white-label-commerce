'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WishlistPage() {
  const { wishlist, count, remove, clear } = useWishlist();
  const { add: addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save your favorite items here while browsing."
        icon="♥"
        actionLabel="Explore Catalog"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Wishlist</h1>
          <p className="text-sm text-slate-400 mt-1">{count} saved items</p>
        </div>
        <button
          onClick={clear}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          Clear Wishlist
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => (
          <div
            key={item.productId}
            className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-square bg-slate-800">
                {item.image ? (
                  <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="300px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-4xl">🛍️</div>
                )}
                <button
                  onClick={() => remove(item.productId)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900/80 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                  aria-label="Remove from wishlist"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-2">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-semibold text-slate-100 text-sm hover:text-primary transition-colors line-clamp-1 block"
                >
                  {item.productName}
                </Link>
                <p className="text-lg font-bold text-white">₹{item.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => {
                  addToCart({
                    productId: item.productId,
                    productName: item.productName,
                    productSlug: item.productSlug,
                    variantId: item.productId,
                    variantName: 'Default',
                    sku: 'N/A',
                    price: item.price,
                    quantity: 1,
                    image: item.image,
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>Add to Cart</span>
                <span>🛒</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
