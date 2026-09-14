'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Category } from '@/lib/api/types';

interface ActiveFilterChipsProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export function ActiveFilterChips({ categories = [] }: ActiveFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sizeParam = searchParams.get('size') || '';
  const colorParam = searchParams.get('color') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const discount = searchParams.get('discount') || '';

  const activeSizes = sizeParam ? sizeParam.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const activeColors = colorParam ? colorParam.split(',').map((c) => c.trim()).filter(Boolean) : [];
  const activeCategoryIds = categoryId ? categoryId.split(',').map((c) => c.trim()).filter(Boolean) : [];

  const removeParam = useCallback(
    (key: string, valueToRemove?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!valueToRemove) {
        params.delete(key);
      } else {
        const currentVal = params.get(key) || '';
        const list = currentVal.split(',').map((v) => v.trim()).filter(Boolean);
        const filtered = list.filter((v) => v !== valueToRemove);
        if (filtered.length > 0) {
          params.set(key, filtered.join(','));
        } else {
          params.delete(key);
        }
      }
      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const sortBy = searchParams.get('sortBy');
    if (sortBy) params.set('sortBy', sortBy);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  const categoryNameMap = new Map<string, string>();
  categories.forEach((c) => {
    categoryNameMap.set(c.id, c.name);
    categoryNameMap.set(c.slug, c.name);
  });

  const hasAnyFilter =
    Boolean(q) ||
    activeCategoryIds.length > 0 ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    activeSizes.length > 0 ||
    activeColors.length > 0 ||
    inStock ||
    Boolean(discount);

  if (!hasAnyFilter) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
        Active Filters:
      </span>

      {q && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200">
          Search: &quot;{q}&quot;
          <button
            onClick={() => removeParam('q')}
            className="hover:text-primary transition-colors text-slate-400 font-bold ml-0.5"
            aria-label="Remove search filter"
          >
            ×
          </button>
        </span>
      )}

      {activeCategoryIds.map((catId) => (
        <span
          key={catId}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 border border-primary/30 text-primary"
        >
          {categoryNameMap.get(catId) || catId}
          <button
            onClick={() => removeParam('categoryId', catId)}
            className="hover:text-white transition-colors font-bold ml-0.5"
            aria-label={`Remove category filter ${catId}`}
          >
            ×
          </button>
        </span>
      ))}

      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200">
          Price: {minPrice ? `₹${minPrice}` : '₹0'} – {maxPrice ? `₹${maxPrice}` : 'Any'}
          <button
            onClick={() => {
              removeParam('minPrice');
              removeParam('maxPrice');
            }}
            className="hover:text-primary transition-colors text-slate-400 font-bold ml-0.5"
            aria-label="Remove price range filter"
          >
            ×
          </button>
        </span>
      )}

      {activeSizes.map((sz) => (
        <span
          key={sz}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200"
        >
          Size: {sz}
          <button
            onClick={() => removeParam('size', sz)}
            className="hover:text-primary transition-colors text-slate-400 font-bold ml-0.5"
            aria-label={`Remove size filter ${sz}`}
          >
            ×
          </button>
        </span>
      ))}

      {activeColors.map((col) => (
        <span
          key={col}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200"
        >
          Color: {col}
          <button
            onClick={() => removeParam('color', col)}
            className="hover:text-primary transition-colors text-slate-400 font-bold ml-0.5"
            aria-label={`Remove color filter ${col}`}
          >
            ×
          </button>
        </span>
      ))}

      {inStock && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
          In Stock Only
          <button
            onClick={() => removeParam('inStock')}
            className="hover:text-white transition-colors font-bold ml-0.5"
            aria-label="Remove in stock filter"
          >
            ×
          </button>
        </span>
      )}

      {discount && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/30 text-amber-400">
          {discount}%+ Off
          <button
            onClick={() => removeParam('discount')}
            className="hover:text-white transition-colors font-bold ml-0.5"
            aria-label="Remove discount filter"
          >
            ×
          </button>
        </span>
      )}

      <button
        onClick={clearAll}
        className="text-xs text-slate-400 hover:text-primary underline font-medium transition-colors ml-1"
      >
        Clear All
      </button>
    </div>
  );
}
