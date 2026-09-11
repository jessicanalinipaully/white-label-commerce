'use client';

import { StoreHomepageSection } from '@commerce/types';

export default function TextSection({ section }: { section: StoreHomepageSection }) {
  return (
    <section className="my-10 p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
      {section.subtitle && (
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          {section.subtitle}
        </span>
      )}
      {section.title && (
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{section.title}</h2>
      )}
      {section.content && (
        <div className="text-slate-300 text-sm sm:text-base leading-relaxed space-y-2">
          {section.content}
        </div>
      )}
    </section>
  );
}
