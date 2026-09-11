import { headers } from 'next/headers';
import { fetchCategories, fetchProducts, fetchStoreInfo } from '@/lib/api/storefront';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const host = headers().get('host') || undefined;
  const [storeInfo, categories, productsRes] = await Promise.all([
    fetchStoreInfo(host),
    fetchCategories(host),
    fetchProducts({ limit: 8 }, host),
  ]);

  const storeName = storeInfo?.name || 'White Label Store';

  return (
    <HomeClient
      categories={categories}
      initialProducts={productsRes?.data || []}
      storeName={storeName}
    />
  );
}
