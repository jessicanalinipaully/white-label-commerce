export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-800 ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
