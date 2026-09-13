'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Category } from '@/lib/api/types';

interface StorefrontNavProps {
  categories: Category[];
}

export function StorefrontNav({ categories }: StorefrontNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
      <Link
        href="/products"
        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
          pathname === '/products'
            ? 'bg-primary/20 text-primary font-semibold'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        All Products
      </Link>
      {categories.map((cat) => {
        const href = `/category/${cat.slug}`;
        const isActive = pathname === href;
        return (
          <Link
            key={cat.id}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-primary/20 text-primary font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}
