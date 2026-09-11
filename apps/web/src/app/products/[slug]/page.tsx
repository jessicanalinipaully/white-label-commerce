import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { fetchProductBySlug } from '@/lib/api/storefront';
import { ProductDetailClient } from './ProductDetailClient';

interface PageProps {
  params: { slug: string };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const host = headers().get('host') || undefined;
  const product = await fetchProductBySlug(params.slug, host);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white transition-colors">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/category/${product.category.slug}`} className="hover:text-white transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-200 truncate">{product.name}</span>
      </nav>

      {/* Interactive Product Detail Client Component */}
      <ProductDetailClient product={product} />
    </div>
  );
}
