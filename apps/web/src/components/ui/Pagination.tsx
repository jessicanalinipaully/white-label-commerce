'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ page, totalPages, total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-10">
      <p className="text-sm text-slate-400">
        {total} product{total !== 1 ? 's' : ''} &bull; Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={() => navigate(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
