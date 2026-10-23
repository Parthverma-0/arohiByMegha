export function formatAddress(a) {
  return [a.line1, a.line2, a.city, `${a.state} - ${a.pincode}`, a.countryCode && a.countryCode !== 'IN' ? a.country : null]
    .filter(Boolean)
    .join(', ');
}

export default function AddressCard({ address, children }) {
  return (
    <div className="text-sm">
      <p className="font-medium flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider bg-blush px-2 py-0.5 rounded">{address.label || 'Home'}</span>
        {address.isDefault && <span className="text-xs text-gold-dark">Default</span>}
      </p>
      <p className="mt-2">{address.fullName} · {address.phone}</p>
      <p className="text-charcoal/70 mt-1">{formatAddress(address)}</p>
      {children}
    </div>
  );
}
