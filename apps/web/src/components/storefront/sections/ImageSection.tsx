'use client';

import { StoreHomepageSection } from '@commerce/types';

export default function ImageSection({ section }: { section: StoreHomepageSection }) {
  if (!section.imageUrl) return null;

  return (
    <section className="my-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
      <img
        src={section.imageUrl}
        alt={section.title || 'Image section'}
        className="w-full max-h-[500px] object-cover"
      />
      {(section.title || section.content) && (
        <div className="p-6">
          {section.title && <h3 className="text-xl font-bold text-white mb-1">{section.title}</h3>}
          {section.content && <p className="text-xs text-slate-400">{section.content}</p>}
        </div>
      )}
    </section>
  );
}
