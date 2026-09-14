'use client';

import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/lib/api/types';

interface WishlistButtonProps {
  product: Pick<Product, 'id' | 'name' | 'price' | 'slug' | 'images'> & { compareAtPrice?: string | number | null };
  className?: string;
  size?: 'sm' | 'md';
}

export function WishlistButton({ product, className = '', size = 'md' }: WishlistButtonProps) {
  const { inWishlist, add, remove } = useWishlist();
  const isWishlisted = inWishlist(product.id);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isWishlisted) {
        await remove(product.id);
      } else {
        await add({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          price: Number(product.price),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          image: product.images?.[0]?.url ?? null,
        });
      }
    } catch (err) {
      console.warn('Wishlist action failed:', err);
    }
  };

  const sizeClass = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base';

  return (
    <button
      onClick={toggle}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`flex items-center justify-center rounded-full border transition-all ${sizeClass} ${
        isWishlisted
          ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-rose-500/50 hover:text-rose-400'
      } ${className}`}
    >
      {isWishlisted ? '♥' : '♡'}
    </button>
  );
}
