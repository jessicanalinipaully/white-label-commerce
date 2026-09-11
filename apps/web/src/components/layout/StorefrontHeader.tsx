'use client';

import Link from 'next/link';
import { useState } from 'react';
import { StoreInfo, Category } from '@/lib/api/types';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { SearchBar } from '../products/SearchBar';
import { StorefrontNav } from './StorefrontNav';
import { CartDrawer } from '../cart/CartDrawer';

interface StorefrontHeaderProps {
  storeInfo: StoreInfo | null;
  categories: Category[];
}

export function StorefrontHeader({ storeInfo, categories }: StorefrontHeaderProps) {
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const storeName = storeInfo?.name || 'White Label Store';

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo / Store Name */}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white tracking-tight hover:opacity-90 transition-opacity">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {storeName}
              </span>
            </Link>

            {/* Search Bar (desktop) */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            {/* Actions: Account, Wishlist & Cart */}
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="p-2 text-slate-300 hover:text-indigo-400 hover:bg-slate-900 rounded-xl transition-colors text-sm font-semibold flex items-center gap-1"
                aria-label="Customer Account"
              >
                <span>👤</span>
                <span className="hidden sm:inline">Account</span>
              </Link>

              <Link
                href="/wishlist"
                className="relative p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
                aria-label="Wishlist"
              >
                <span className="text-xl">♥</span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-300 hover:text-indigo-400 hover:bg-slate-900 rounded-xl transition-colors"
                aria-label="Shopping Cart"
              >
                <span className="text-xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden pb-3">
            <SearchBar />
          </div>

          {/* Navigation Bar */}
          <StorefrontNav categories={categories} />
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
