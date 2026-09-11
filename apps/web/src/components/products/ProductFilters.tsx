'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Category } from '@/lib/api/types';

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const currentCategory = searchParams.get('categoryId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  return (
    <div className="space-y-6">
      {/* Category filter */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category</h3>
          <div className="space-y-1">
            <button
              onClick={() => update('categoryId', '')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentCategory ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              All categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => update('categoryId', cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentCategory === cat.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.name}
                {cat._count && (
                  <span className="ml-2 text-xs text-slate-500">({cat._count.products})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price Range</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-slate-500 text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            min="0"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Clear filters */}
      {(currentCategory || minPrice || maxPrice || searchParams.get('q')) && (
        <button
          onClick={() => router.push(pathname)}
          className="w-full py-2 rounded-lg border border-slate-700 text-sm text-slate-400 hover:bg-slate-800 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
