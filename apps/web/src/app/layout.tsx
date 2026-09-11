import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { fetchCategories, fetchStoreInfo } from '@/lib/api/storefront';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';

export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get('host') || undefined;
  const storeInfo = await fetchStoreInfo(host);
  const storeName = storeInfo?.name || 'Storefront';

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: `Welcome to ${storeName} storefront`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = headers().get('host') || undefined;
  const [storeInfo, categories] = await Promise.all([
    fetchStoreInfo(host),
    fetchCategories(host),
  ]);

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <WishlistProvider>
                <StorefrontHeader storeInfo={storeInfo} categories={categories} />
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
                <StorefrontFooter storeInfo={storeInfo} />
              </WishlistProvider>
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
