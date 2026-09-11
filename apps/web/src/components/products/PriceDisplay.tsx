interface PriceDisplayProps {
  price: number | string;
  compareAtPrice?: number | string | null;
  className?: string;
}

export function PriceDisplay({ price, compareAtPrice, className = '' }: PriceDisplayProps) {
  const priceNum = Number(price);
  const compareNum = compareAtPrice ? Number(compareAtPrice) : null;
  const hasDiscount = compareNum && compareNum > priceNum;
  const discountPct = hasDiscount ? Math.round((1 - priceNum / compareNum) * 100) : 0;

  return (
    <div className={`flex items-baseline gap-2 flex-wrap ${className}`}>
      <span className="text-xl font-bold text-white">
        ₹{priceNum.toFixed(2)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-slate-500 line-through">₹{compareNum.toFixed(2)}</span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            -{discountPct}%
          </span>
        </>
      )}
    </div>
  );
}
