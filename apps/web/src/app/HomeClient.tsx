'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import HomepageSectionRenderer from '@/components/storefront/sections/HomepageSectionRenderer';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Category } from '@/lib/api/types';

interface HomeClientProps {
  categories: Category[];
  initialProducts: any[];
  storeName: string;
}

export default function HomeClient({ categories, initialProducts, storeName }: HomeClientProps) {
  const { config, loading } = useTheme();

  const sections = config?.sections || [];

  if (!loading && sections.length > 0) {
    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <HomepageSectionRenderer key={section.id} section={section} />
        ))}
      </div>
    );
  }

  // Fallback default homepage if no sections configured yet
  return (
    <div className="space-y-16">
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 md:p-16">
        <div className="relative max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <span>✨ Welcome to {storeName}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            Discover Exclusive Collections
          </h1>
          <p className="text-lg text-slate-300">
            Explore our carefully curated range of products. Every item is handpicked for quality and elegance.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/products"
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              Shop All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      {categories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">Shop by Category</h2>
            <Link href="/products" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-center transition-all"
              >
                <div className="text-3xl mb-2">📁</div>
                <h3 className="font-semibold text-slate-200 text-sm group-hover:text-white truncate">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Products</h2>
            <p className="text-sm text-slate-400">Handpicked items for this store</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
            Browse catalog →
          </Link>
        </div>

        <ProductGrid
          products={initialProducts}
          emptyTitle="No products available"
          emptyDescription="Check back soon for new arrivals."
        />
      </section>
    </div>
  );
}
