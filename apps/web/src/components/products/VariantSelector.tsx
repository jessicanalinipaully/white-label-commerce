'use client';

import { ProductVariant } from '@/lib/api/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

/** Groups variants by a given attribute key (e.g. "size", "color") */
function groupByAttribute(variants: ProductVariant[], key: string): Record<string, ProductVariant[]> {
  const groups: Record<string, ProductVariant[]> = {};
  for (const v of variants) {
    const val = v.attributes?.[key];
    if (val !== undefined) {
      groups[val] = groups[val] || [];
      groups[val].push(v);
    }
  }
  return groups;
}

function getAttributeKeys(variants: ProductVariant[]): string[] {
  const keys = new Set<string>();
  for (const v of variants) {
    Object.keys(v.attributes || {}).forEach((k) => keys.add(k));
  }
  return Array.from(keys);
}

function isAvailable(variant: ProductVariant): boolean {
  if (!variant.isActive) return false;
  if (!variant.inventory) return false;
  return (variant.inventory.quantity - variant.inventory.reservedQuantity) > 0;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  // If there's only one variant, no UI needed (but it's auto-selected)
  if (variants.length === 1) {
    const v = variants[0];
    return (
      <div className="text-sm text-slate-400">
        SKU: <span className="text-slate-300 font-mono">{v.sku}</span>
      </div>
    );
  }

  const attrKeys = getAttributeKeys(variants);

  // If no structured attributes, fall back to a flat list
  if (attrKeys.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-300">Select variant:</p>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const available = isAvailable(v);
            const selected = v.id === selectedVariantId;
            return (
              <button
                key={v.id}
                onClick={() => available && onSelect(v)}
                disabled={!available}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  selected
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : available
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                    : 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed line-through'
                }`}
              >
                {v.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Group by first attribute key for display (typically "size" or "color")
  const primaryKey = attrKeys[0];
  const groups = groupByAttribute(variants, primaryKey);

  return (
    <div className="space-y-4">
      {attrKeys.map((key) => {
        const values = Array.from(new Set(variants.map((v) => v.attributes?.[key]).filter(Boolean)));
        return (
          <div key={key} className="space-y-2">
            <p className="text-sm font-medium text-slate-300 capitalize">{key}:</p>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                // Find the variant matching this attribute (and all currently-selected attrs)
                const matchingVariant = variants.find((v) => v.attributes?.[key] === val);
                const available = matchingVariant ? isAvailable(matchingVariant) : false;
                const isSelected = matchingVariant?.id === selectedVariantId;

                return (
                  <button
                    key={val}
                    onClick={() => matchingVariant && available && onSelect(matchingVariant)}
                    disabled={!available || !matchingVariant}
                    title={!available ? 'Out of stock' : val}
                    className={`min-w-[3rem] px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/30'
                        : available
                        ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700'
                        : 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed relative'
                    }`}
                  >
                    {val}
                    {!available && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="block h-px w-full bg-slate-600 rotate-12 absolute" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
