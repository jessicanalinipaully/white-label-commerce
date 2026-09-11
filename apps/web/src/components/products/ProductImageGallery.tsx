'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ProductImage } from '@/lib/api/types';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-slate-800 flex items-center justify-center text-slate-600 text-8xl">
        🛍️
      </div>
    );
  }

  const selected = images[selectedIdx];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800">
        <Image
          src={selected.url}
          alt={selected.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIdx === 0}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIdx(idx)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIdx
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || `${productName} image ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
