'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/api/types';
import { PriceDisplay } from './PriceDisplay';
import { WishlistButton } from '../wishlist/WishlistButton';
import { Badge } from '../ui/Badge';

function getAvailability(product: Product) {
  if (!product.variants || product.variants.length === 0) {
    return { available: true, label: 'In Stock', variant: 'success' as const };
  }
  const totalAvailable = product.variants.reduce((sum, v) => {
    if (!v.inventory) return sum;
    return sum + (v.inventory.quantity - v.inventory.reservedQuantity);
  }, 0);
  if (totalAvailable <= 0) return { available: false, label: 'Out of Stock', variant: 'error' as const };
  if (totalAvailable <= 5) return { available: true, label: `Only ${totalAvailable} left`, variant: 'warning' as const };
  return { available: true, label: 'In Stock', variant: 'success' as const };
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const availability = getAvailability(product);
  const image = product.images?.[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square bg-slate-800 overflow-hidden">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-5xl">
              🛍️
            </div>
          )}
          {/* Wishlist button overlay */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton product={product} size="sm" />
          </div>
          {/* Category badge */}
          {product.category && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-slate-300 backdrop-blur-sm">
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-slate-100 text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
            {product.name}
          </h3>
          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
          <div className="flex items-center justify-between pt-1">
            <Badge variant={availability.variant}>{availability.label}</Badge>
            {product.variants && product.variants.length > 1 && (
              <span className="text-xs text-slate-500">{product.variants.length} variants</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
