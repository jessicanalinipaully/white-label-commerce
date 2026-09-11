'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Overview', href: '/admin', icon: '📊' },
  { label: 'Theme Styling', href: '/admin/theme', icon: '🎨' },
  { label: 'Store Branding', href: '/admin/branding', icon: '🏷️' },
  { label: 'Homepage CMS', href: '/admin/homepage', icon: '🖼️' },
  { label: 'Products', href: '/admin/products', icon: '🛍️' },
  { label: 'Categories', href: '/admin/categories', icon: '📁' },
  { label: 'Inventory', href: '/admin/inventory', icon: '📦' },
  { label: 'Orders', href: '/admin/orders', icon: '🧾' },
  { label: 'Customers', href: '/admin/customers', icon: '👥' },
  { label: 'Shipping', href: '/admin/shipping', icon: '🚚' },
  { label: 'Store Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Admin Console
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <span>← Back to Storefront</span>
        </Link>
      </div>
    </aside>
  );
}
