'use client';

import { useState } from 'react';
import { Product, ProductVariant } from '@/lib/api/types';
import { useCart } from '@/context/CartContext';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { VariantSelector } from '@/components/products/VariantSelector';
import { PriceDisplay } from '@/components/products/PriceDisplay';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { Badge } from '@/components/ui/Badge';

export function ProductDetailClient({ product }: { product: Product }) {
  const { add: addToCart } = useCart();

  // Selected variant state
  const defaultVariant = product.variants?.[0] || null;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(defaultVariant);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Dynamic price calculation based on variant
  const currentPrice = selectedVariant?.price !== null && selectedVariant?.price !== undefined
    ? Number(selectedVariant.price)
    : Number(product.price);

  // Dynamic inventory check
  const inventory = selectedVariant?.inventory;
  const availableQty = inventory ? inventory.quantity - inventory.reservedQuantity : 999;
  const isOutOfStock = Boolean(availableQty <= 0 || (selectedVariant && !selectedVariant.isActive));

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant?.id || product.id,
      variantName: selectedVariant?.name || 'Default',
      sku: selectedVariant?.sku || product.sku || 'N/A',
      price: currentPrice,
      quantity,
      image: product.images?.[0]?.url || null,
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Gallery */}
      <ProductImageGallery images={product.images} productName={product.name} />

      {/* Details & Interactive Selection */}
      <div className="space-y-6">
        {/* Category & Status */}
        <div className="flex items-center justify-between">
          {product.category ? (
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {product.category.name}
            </span>
          ) : (
            <span />
          )}
          <Badge variant={isOutOfStock ? 'error' : availableQty <= 5 ? 'warning' : 'success'}>
            {isOutOfStock
              ? 'Out of Stock'
              : availableQty <= 5
              ? `Only ${availableQty} left`
              : 'In Stock'}
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {product.name}
        </h1>

        {/* Price */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <PriceDisplay price={currentPrice} compareAtPrice={product.compareAtPrice} className="text-2xl" />
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        )}

        {/* Variant Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariant?.id || null}
              onSelect={(variant) => {
                setSelectedVariant(variant);
                if (quantity > (variant.inventory?.quantity || 1)) {
                  setQuantity(1);
                }
              }}
            />
          </div>
        )}

        {/* Quantity + Add to Cart */}
        <div className="space-y-4 pt-2">
          <div className="flex gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
              >
                −
              </button>
              <span className="w-10 text-center font-bold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(availableQty, quantity + 1))}
                disabled={quantity >= availableQty || isOutOfStock}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-bold text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              {!isOutOfStock && <span>🛒</span>}
            </button>

            {/* Wishlist Button */}
            <WishlistButton product={product} size="md" />
          </div>

          {/* Feedback banner */}
          {addedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center justify-between animate-fadeIn">
              <span>Added to cart successfully!</span>
              <span className="text-xs">🛒</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
