import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { fetchCategoryProducts } from '@/lib/api/storefront';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductSortSelect } from '@/components/products/ProductSortSelect';
import { Pagination } from '@/components/ui/Pagination';

interface PageProps {
  params: { slug: string };
  searchParams: {
    page?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const host = headers().get('host') || undefined;

  const page = Number(searchParams.page) || 1;
  const q = searchParams.q || undefined;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const sortBy = searchParams.sortBy || undefined;

  const res = await fetchCategoryProducts(
    params.slug,
    { page, limit: 12, q, minPrice, maxPrice, sortBy },
    host,
  );

  if (!res) {
    notFound();
  }

  const { category, products } = res;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white transition-colors">Categories</Link>
        <span>/</span>
        <span className="text-slate-200">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Category</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{category.name}</h1>
          {category.description && <p className="text-slate-300 text-sm max-w-xl">{category.description}</p>}
        </div>
        <ProductSortSelect />
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
        <ProductGrid
          products={products.data}
          emptyTitle={`No products in ${category.name}`}
          emptyDescription="Check back soon for new additions to this category."
        />
        <Pagination page={products.page} totalPages={products.totalPages} total={products.total} />
      </div>
    </div>
  );
}
