'use client';

import Link from 'next/link';
import { StoreHomepageSection } from '@commerce/types';

export default function PromoBannerSection({ section }: { section: StoreHomepageSection }) {
  return (
    <section className="my-10 p-6 sm:p-10 rounded-3xl bg-slate-900 border border-primary/30 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
      <div className="space-y-2 max-w-xl">
        {section.subtitle && (
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {section.subtitle}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {section.title || 'Special Promotion'}
        </h2>
        {section.content && (
          <p className="text-sm text-slate-300">{section.content}</p>
        )}
      </div>

      {section.buttonText && section.buttonUrl && (
        <Link
          href={section.buttonUrl}
          className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 font-bold text-slate-950 transition-all text-sm shadow-lg whitespace-nowrap"
        >
          {section.buttonText}
        </Link>
      )}
    </section>
  );
}
