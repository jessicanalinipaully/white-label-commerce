'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WishlistPage() {
  const { wishlist, count, remove, clear, moveToCart, isHydrated } = useWishlist();
  const { add: addToCart } = useCart();

  if (!isHydrated) {
    return (
      <div className="py-16 text-center text-slate-500">
        <div className="inline-block text-3xl animate-bounce mb-2">♥</div>
        <p className="text-sm font-medium animate-pulse">Loading your wishlist...</p>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save items you love and come back to them later."
        icon="♥"
        actionLabel="Continue Shopping"
        actionHref="/products"
      />
    );
  }

  const handleMoveToCart = async (item: any) => {
    try {
      // Add to cart context
      await addToCart({
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

      // Move item in wishlist context (removes from wishlist)
      await moveToCart(item.productId);
    } catch (err) {
      console.warn('Failed to move item to cart:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Wishlist</h1>
          <p className="text-sm text-slate-400 mt-1">{count} saved item{count === 1 ? '' : 's'}</p>
        </div>
        <button
          onClick={clear}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors font-medium"
        >
          Clear Wishlist
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((item) => {
          const isAvailable = item.isAvailable !== false;
          const hasDiscount = item.compareAtPrice && item.compareAtPrice > item.price;
          const discountPercent = hasDiscount
            ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100)
            : 0;

          return (
            <div
              key={item.productId}
              className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                <div className="relative aspect-square bg-slate-800">
                  {item.image ? (
                    <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="300px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-4xl">🛍️</div>
                  )}

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      -{discountPercent}%
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => remove(item.productId)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors shadow"
                    aria-label="Remove from wishlist"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  {item.categoryName && (
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                      {item.categoryName}
                    </span>
                  )}

                  <Link
                    href={`/products/${item.productSlug}`}
                    className="font-semibold text-slate-100 text-sm hover:text-primary transition-colors line-clamp-1 block"
                  >
                    {item.productName}
                  </Link>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white">₹{Number(item.price).toFixed(2)}</span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-500 line-through">
                        ₹{Number(item.compareAtPrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Availability Badge */}
                  {!isAvailable ? (
                    <span className="inline-block text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      Currently unavailable
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      In Stock
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  disabled={!isAvailable}
                  onClick={() => handleMoveToCart(item)}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                >
                  <span>Add to Cart</span>
                  <span>🛒</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
