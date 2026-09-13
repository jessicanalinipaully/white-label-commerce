'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set('q', q.trim());
        params.delete('page');
      } else {
        params.delete('q');
      }
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSearch(value); }}
      className="relative"
    >
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
      />
      <button
        type="submit"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
      >
        🔍
      </button>
    </form>
  );
}
