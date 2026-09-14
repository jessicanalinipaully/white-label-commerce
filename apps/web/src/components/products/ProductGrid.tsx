import { Product } from '@/lib/api/types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

interface ProductGridProps {
  products?: Product[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function ProductGrid({
  products = [],
  loading = false,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your search or filters.',
  actionLabel = 'Clear Filters',
  actionHref = '/products',
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon="🔍"
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
