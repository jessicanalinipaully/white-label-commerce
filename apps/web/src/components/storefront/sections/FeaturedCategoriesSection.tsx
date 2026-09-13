'use client';

import Link from 'next/link';
import { StoreHomepageSection } from '@commerce/types';

export default function FeaturedCategoriesSection({ section }: { section: StoreHomepageSection }) {
  const category = section.category;

  return (
    <section className="my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
      <div>
        {section.subtitle && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {section.subtitle}
          </span>
        )}
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          {section.title || 'Featured Category'}
        </h2>
      </div>

      {category ? (
        <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white">{category.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{category.description || 'Explore products in this category.'}</p>
          </div>
          <Link
            href={`/category/${category.slug}`}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all shadow-md shadow-primary/20"
          >
            Browse Category →
          </Link>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm">
          {section.content || 'Browse our curated categories.'}
        </div>
      )}
    </section>
  );
}
