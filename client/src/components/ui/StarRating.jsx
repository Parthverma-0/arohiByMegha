export default function StarRating({ value = 0, count, size = 'sm' }) {
  const stars = [1, 2, 3, 4, 5];
  const dim = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {stars.map((s) => (
          <svg key={s} viewBox="0 0 20 20" className={`${dim} ${s <= Math.round(value) ? 'fill-gold' : 'fill-charcoal/15'}`}>
            <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.2 6.1-.6z" />
          </svg>
        ))}
      </div>
      {typeof count === 'number' && <span className="text-xs text-charcoal/60">({count})</span>}
    </div>
  );
}
