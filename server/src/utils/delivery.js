// Orders of ₹399 or more (after any coupon discount) ship free; anything
// below that pays a flat ₹90 per order.
const FREE_DELIVERY_MIN = 399; // ₹
const FLAT_FEE = 90;           // ₹

const formatRs = (n) => `₹${Math.round(n * 100) / 100}`;

// Returns { fee, note }. fee is null when it can't be worked out
// automatically (outside India) — such orders can't be paid online yet.
export function quoteDelivery(address = {}, orderValue = 0) {
  const countryCode = address.countryCode || 'IN';
  if (countryCode !== 'IN') {
    return { fee: null, note: 'We currently deliver within India only — please contact us for international orders' };
  }

  if (orderValue >= FREE_DELIVERY_MIN) {
    return { fee: 0, note: `Free delivery on orders of ${formatRs(FREE_DELIVERY_MIN)} and above` };
  }
  return { fee: FLAT_FEE, note: `Add ${formatRs(FREE_DELIVERY_MIN - orderValue)} more for free delivery` };
}

export const DELIVERY_RULES = { FREE_DELIVERY_MIN, FLAT_FEE };
