'use client';

import Link from 'next/link';
import { StoreInfo } from '@/lib/api/types';
import { useTheme } from '@/context/ThemeContext';

interface StorefrontFooterProps {
  storeInfo: StoreInfo | null;
}

export function StorefrontFooter({ storeInfo }: StorefrontFooterProps) {
  const { config } = useTheme();
  const branding = config?.branding;
  const storeName = branding?.storeDisplayName || storeInfo?.name || 'White Label Store';
  const tagline = branding?.tagline || 'Powered by White Label E-Commerce Platform. High quality products curated just for you.';

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-lg">{storeName}</h3>
            <p className="text-sm text-slate-500">{tagline}</p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 text-sm">Customer Care</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-slate-500 cursor-not-allowed">Shipping Policy</span></li>
              <li><span className="text-slate-500 cursor-not-allowed">Returns & Exchanges</span></li>
              <li><span className="text-slate-500 cursor-not-allowed">FAQs</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 text-sm">About</h4>
            <p className="text-xs text-slate-500">
              This tenant-isolated storefront is dynamically generated for host <span className="font-mono text-slate-400">{storeInfo?.domains?.[0]?.domain || 'tenant'}</span>.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p>Multi-Tenant Storefront Platform</p>
        </div>
      </div>
    </footer>
  );
}
