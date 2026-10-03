// When `onRemove` is given, the minus button at the minimum quantity turns
// into a remove (bin) button instead of going dead — otherwise there is no
// obvious way to drop the last unit of an item, especially on a phone.
export default function QuantitySelector({ value, onChange, onRemove, min = 1, max = 20, disabled = false }) {
  const removeMode = Boolean(onRemove) && value <= min;
  return (
    <div className="inline-flex items-center border border-charcoal/20 rounded-full">
      <button
        type="button"
        aria-label={removeMode ? 'Remove item' : 'Decrease quantity'}
        className="w-9 h-9 flex items-center justify-center disabled:opacity-30"
        disabled={disabled || (!removeMode && value <= min)}
        onClick={() => (removeMode ? onRemove() : onChange(value - 1))}
      >
        {removeMode ? <BinIcon /> : '−'}
      </button>
      <span className="w-8 text-center text-sm">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="w-9 h-9 flex items-center justify-center disabled:opacity-30"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

function BinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
