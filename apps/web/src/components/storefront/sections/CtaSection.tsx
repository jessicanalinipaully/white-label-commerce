'use client';

import Link from 'next/link';
import { StoreHomepageSection } from '@commerce/types';

export default function CtaSection({ section }: { section: StoreHomepageSection }) {
  return (
    <section className="my-12 p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6">
      <div className="max-w-xl mx-auto space-y-3">
        {section.subtitle && (
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            {section.subtitle}
          </span>
        )}
        <h2 className="text-3xl font-black text-white tracking-tight">
          {section.title || 'Ready to Shop?'}
        </h2>
        {section.content && (
          <p className="text-sm text-slate-300">{section.content}</p>
        )}
      </div>

      {section.buttonText && section.buttonUrl && (
        <Link
          href={section.buttonUrl}
          className="inline-block px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-all shadow-lg shadow-indigo-600/30 text-sm"
        >
          {section.buttonText}
        </Link>
      )}
    </section>
  );
}
