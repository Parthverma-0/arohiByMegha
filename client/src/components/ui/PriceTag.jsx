function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export default function PriceTag({ price, mrp, size = 'md' }) {
  const hasDiscount = mrp && mrp > price;
  const percentOff = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const textSize = size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-medium ${textSize}`}>{formatINR(price)}</span>
      {hasDiscount && (
        <>
          <span className="text-charcoal/40 line-through text-sm">{formatINR(mrp)}</span>
          <span className="text-gold-dark text-sm">{percentOff}% off</span>
        </>
      )}
    </div>
  );
}

export { formatINR };
