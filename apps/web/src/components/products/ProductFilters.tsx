'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Category, FilterOptions } from '@/lib/api/types';

interface ProductFiltersProps {
  categories?: Category[];
  filterOptions?: FilterOptions;
}

export function ProductFilters({ categories = [], filterOptions }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mobile drawer state
  const [isOpen, setIsOpen] = useState(false);

  // Accordion section collapse state
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    sizes: true,
    colors: true,
    availability: true,
    discount: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Available options
  const displayCategories = filterOptions?.categories || categories;
  const availableSizes = filterOptions?.availableSizes || [];
  const availableColors = filterOptions?.availableColors || [];

  // Active query param states
  const currentCategoryId = searchParams.get('categoryId') || '';
  const activeCategoryIds = currentCategoryId ? currentCategoryId.split(',').map((c) => c.trim()).filter(Boolean) : [];
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeSizeParam = searchParams.get('size') || '';
  const activeSizes = activeSizeParam ? activeSizeParam.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const activeColorParam = searchParams.get('color') || '';
  const activeColors = activeColorParam ? activeColorParam.split(',').map((c) => c.trim()).filter(Boolean) : [];
  const activeInStock = searchParams.get('inStock') === 'true';
  const activeDiscount = searchParams.get('discount') || '';

  // Local price input state for smooth editing
  const [minPriceInput, setMinPriceInput] = useState(activeMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(activeMaxPrice);

  useEffect(() => {
    setMinPriceInput(activeMinPrice);
    setMaxPriceInput(activeMaxPrice);
  }, [activeMinPrice, activeMaxPrice]);

  // Generic URL update function
  const updateQuery = useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete('page'); // Reset to page 1 on filter change
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  // Category toggle handler
  const handleCategoryToggle = (catIdOrSlug: string) => {
    let next: string[];
    if (activeCategoryIds.includes(catIdOrSlug)) {
      next = activeCategoryIds.filter((id) => id !== catIdOrSlug);
    } else {
      next = [...activeCategoryIds, catIdOrSlug];
    }
    updateQuery({ categoryId: next.length > 0 ? next.join(',') : null });
  };

  // Multi-select size handler
  const handleSizeToggle = (size: string) => {
    let next: string[];
    if (activeSizes.includes(size)) {
      next = activeSizes.filter((s) => s !== size);
    } else {
      next = [...activeSizes, size];
    }
    updateQuery({ size: next.length > 0 ? next.join(',') : null });
  };

  // Multi-select color handler
  const handleColorToggle = (color: string) => {
    let next: string[];
    if (activeColors.includes(color)) {
      next = activeColors.filter((c) => c !== color);
    } else {
      next = [...activeColors, color];
    }
    updateQuery({ color: next.length > 0 ? next.join(',') : null });
  };

  // Price range apply handler
  const handlePriceApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const minNum = minPriceInput ? Math.max(0, Number(minPriceInput)) : null;
    const maxNum = maxPriceInput ? Math.max(0, Number(maxPriceInput)) : null;

    if (minNum !== null && maxNum !== null && minNum > maxNum) {
      // Swap if min > max
      updateQuery({ minPrice: String(maxNum), maxPrice: String(minNum) });
    } else {
      updateQuery({
        minPrice: minNum !== null && !isNaN(minNum) ? String(minNum) : null,
        maxPrice: maxNum !== null && !isNaN(maxNum) ? String(maxNum) : null,
      });
    }
  };

  // Count active filters for badge
  const activeCount =
    activeCategoryIds.length +
    (activeMinPrice || activeMaxPrice ? 1 : 0) +
    activeSizes.length +
    activeColors.length +
    (activeInStock ? 1 : 0) +
    (activeDiscount ? 1 : 0);

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    const sortBy = searchParams.get('sortBy');
    if (sortBy) params.set('sortBy', sortBy);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Filter Header & Clear All */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-white font-bold">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium text-slate-400 hover:text-primary transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. Category Section */}
      {displayCategories.length > 0 && (
        <div className="border-b border-slate-800/80 pb-5 space-y-3">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
          >
            <span>Category</span>
            <span className="text-slate-500 text-xs">{openSections.categories ? '−' : '+'}</span>
          </button>
          {openSections.categories && (
            <div className="space-y-1.5 pt-1 max-h-56 overflow-y-auto pr-1">
              {displayCategories.map((cat) => {
                const isSelected = activeCategoryIds.includes(cat.id) || activeCategoryIds.includes(cat.slug);
                return (
                  <label
                    key={cat.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/20 text-primary font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-slate-900"
                      />
                      <span>{cat.name}</span>
                    </div>
                    {cat._count?.products !== undefined && (
                      <span className="text-xs text-slate-500 font-normal">({cat._count.products})</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Price Range Section */}
      <div className="border-b border-slate-800/80 pb-5 space-y-3">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
        >
          <span>Price Range</span>
          <span className="text-slate-500 text-xs">{openSections.price ? '−' : '+'}</span>
        </button>
        {openSections.price && (
          <form onSubmit={handlePriceApply} className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-xs text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  min="0"
                  className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-slate-500 text-xs">–</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-xs text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  min="0"
                  className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
            >
              Apply Price
            </button>
          </form>
        )}
      </div>

      {/* 3. Sizes Section */}
      {availableSizes.length > 0 && (
        <div className="border-b border-slate-800/80 pb-5 space-y-3">
          <button
            onClick={() => toggleSection('sizes')}
            className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
          >
            <span>Size</span>
            <span className="text-slate-500 text-xs">{openSections.sizes ? '−' : '+'}</span>
          </button>
          {openSections.sizes && (
            <div className="flex flex-wrap gap-2 pt-1">
              {availableSizes.map((sz) => {
                const isSelected = activeSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeToggle(sz)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Colors Section */}
      {availableColors.length > 0 && (
        <div className="border-b border-slate-800/80 pb-5 space-y-3">
          <button
            onClick={() => toggleSection('colors')}
            className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
          >
            <span>Color</span>
            <span className="text-slate-500 text-xs">{openSections.colors ? '−' : '+'}</span>
          </button>
          {openSections.colors && (
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
              {availableColors.map((color) => {
                const isSelected = activeColors.includes(color);
                return (
                  <label
                    key={color}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/20 text-primary font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleColorToggle(color)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-slate-900"
                    />
                    <span>{color}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Availability Section */}
      <div className="border-b border-slate-800/80 pb-5 space-y-3">
        <button
          onClick={() => toggleSection('availability')}
          className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
        >
          <span>Availability</span>
          <span className="text-slate-500 text-xs">{openSections.availability ? '−' : '+'}</span>
        </button>
        {openSections.availability && (
          <label className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors pt-1">
            <input
              type="checkbox"
              checked={activeInStock}
              onChange={(e) => updateQuery({ inStock: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-slate-900"
            />
            <span className={activeInStock ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
              In Stock Only
            </span>
          </label>
        )}
      </div>

      {/* 6. Discount Threshold Section */}
      <div className="pb-2 space-y-3">
        <button
          onClick={() => toggleSection('discount')}
          className="w-full flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
        >
          <span>Discount</span>
          <span className="text-slate-500 text-xs">{openSections.discount ? '−' : '+'}</span>
        </button>
        {openSections.discount && (
          <div className="space-y-1 pt-1">
            {['10', '20', '30', '50'].map((disc) => {
              const isSelected = activeDiscount === disc;
              return (
                <button
                  key={disc}
                  type="button"
                  onClick={() => updateQuery({ discount: isSelected ? null : disc })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {disc}% or more
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-semibold hover:border-slate-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>Filter Products</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-white font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Drawer / Modal Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Filter Products</span>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-white font-bold">
                    {activeCount}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 text-xl font-bold"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            {/* Mobile Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1">{filterContent}</div>

            {/* Mobile Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-3">
              <button
                onClick={() => {
                  clearAllFilters();
                  setIsOpen(false);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-sm font-semibold text-white transition-colors shadow-lg shadow-primary/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden md:block">{filterContent}</div>
    </>
  );
}
