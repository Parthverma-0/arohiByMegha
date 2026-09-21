export default function QuantitySelector({ value, onChange, min = 1, max = 20 }) {
  return (
    <div className="inline-flex items-center border border-charcoal/20 rounded-full">
      <button
        type="button"
        className="w-9 h-9 flex items-center justify-center disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-8 text-center text-sm">{value}</span>
      <button
        type="button"
        className="w-9 h-9 flex items-center justify-center disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
