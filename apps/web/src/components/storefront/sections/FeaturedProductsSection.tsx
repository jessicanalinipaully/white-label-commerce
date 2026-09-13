'use client';

import Link from 'next/link';
import { StoreHomepageSection } from '@commerce/types';

export default function FeaturedProductsSection({ section }: { section: StoreHomepageSection }) {
  const product = section.product;

  return (
    <section className="my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {section.subtitle && (
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {section.subtitle}
            </span>
          )}
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {section.title || 'Featured Product'}
          </h2>
        </div>
      </div>

      {product ? (
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
          {product.images?.[0] && (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-48 h-48 object-cover rounded-xl bg-slate-800 border border-slate-800"
            />
          )}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">{product.name}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{product.description || product.shortDescription}</p>
            <p className="text-lg font-extrabold text-primary">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>
            <Link
              href={`/products/${product.slug}`}
              className="inline-block px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all shadow-md shadow-primary/20"
            >
              View Featured Item →
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm">
          {section.content || 'Explore our exclusive collection of featured products.'}
        </div>
      )}
    </section>
  );
}
