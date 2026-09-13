'use client';

import Link from 'next/link';
import { StoreHomepageSection } from '@commerce/types';

export default function HeroSection({ section }: { section: StoreHomepageSection }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-16 text-center sm:text-left my-8">
      <div className="max-w-2xl space-y-6 z-10 relative">
        {section.subtitle && (
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {section.subtitle}
          </span>
        )}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          {section.title || 'Welcome to Our Store'}
        </h1>
        {section.content && (
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            {section.content}
          </p>
        )}
        {section.buttonText && section.buttonUrl && (
          <div className="pt-2">
            <Link
              href={section.buttonUrl}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover font-bold text-white transition-all shadow-lg shadow-primary/30 text-base"
            >
              <span>{section.buttonText}</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </div>

      {section.imageUrl && (
        <div className="mt-8 sm:mt-0 sm:absolute sm:right-8 sm:top-1/2 sm:-translate-y-1/2 sm:w-1/3">
          <img
            src={section.imageUrl}
            alt={section.title || 'Hero'}
            className="w-full h-64 sm:h-80 object-cover rounded-2xl border border-slate-800 shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}
