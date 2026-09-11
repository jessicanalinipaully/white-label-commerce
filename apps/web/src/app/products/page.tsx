import { headers } from 'next/headers';
import { fetchCategories, fetchProducts } from '@/lib/api/storefront';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSortSelect } from '@/components/products/ProductSortSelect';
import { Pagination } from '@/components/ui/Pagination';

interface PageProps {
  searchParams: {
    page?: string;
    q?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const host = headers().get('host') || undefined;

  const page = Number(searchParams.page) || 1;
  const q = searchParams.q || undefined;
  const categoryId = searchParams.categoryId || undefined;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const sortBy = searchParams.sortBy || undefined;

  const [categories, productsRes] = await Promise.all([
    fetchCategories(host),
    fetchProducts({ page, limit: 12, q, categoryId, minPrice, maxPrice, sortBy }, host),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {q ? `Search results for "${q}"` : 'All Products'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Showing {productsRes.data.length} of {productsRes.total} items
          </p>
        </div>
        <ProductSortSelect />
      </div>

      {/* Main Layout: Filters sidebar + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <ProductFilters categories={categories} />
          </div>
        </aside>

        {/* Grid + Pagination */}
        <main className="md:col-span-3 space-y-6">
          <ProductGrid products={productsRes.data} />
          <Pagination
            page={productsRes.page}
            totalPages={productsRes.totalPages}
            total={productsRes.total}
          />
        </main>
      </div>
    </div>
  );
}
