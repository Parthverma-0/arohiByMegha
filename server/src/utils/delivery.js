import { City, State } from 'country-state-city';

// Orders are dispatched from 191 Narsing Garden, outside Suraj Pol Gate,
// Galta Road, Jaipur 302003.
const ORIGIN = { lat: 26.9191, lng: 75.8449 };

// Every order pays ₹9/km, with a minimum of ₹90.
const MIN_FEE = 90; // ₹
const PER_KM = 9;   // ₹ per km, charged when it comes to more than MIN_FEE
// Distances are measured as the crow flies; roads are typically ~25% longer.
const ROAD_FACTOR = 1.25;

const toRad = (d) => (d * Math.PI) / 180;
function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Pincode → coordinates via OpenStreetMap's Nominatim (free, ~1 req/s fair use).
// Cached per server instance; quotes for the same pincode repeat a lot.
const pincodeCache = new Map();
async function geocodePincode(pincode) {
  if (pincodeCache.has(pincode)) return pincodeCache.get(pincode);
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&postalcode=${encodeURIComponent(pincode)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ArohiByMegha/1.0 (https://www.arohibymegha.in)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const [hit] = await res.json();
    const point = hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
    if (point) pincodeCache.set(pincode, point);
    return point;
  } catch {
    return null;
  }
}

// Fallback when the pincode can't be located: the city's (or state's)
// coordinates from the same dataset that feeds the address dropdowns.
function locateCity({ countryCode, stateCode, city }) {
  const match = City.getCitiesOfState(countryCode, stateCode).find((c) => c.name.toLowerCase() === String(city).trim().toLowerCase());
  const place = match || State.getStateByCodeAndCountry(stateCode, countryCode);
  return place?.latitude ? { lat: Number(place.latitude), lng: Number(place.longitude) } : null;
}

// Returns { fee, distanceKm, note }. fee is null when it can't be worked out
// automatically (outside India, or an address we couldn't locate) — the
// order still goes through and the fee is agreed on WhatsApp.
export async function quoteDelivery(address = {}) {
  const countryCode = address.countryCode || 'IN';
  if (countryCode !== 'IN') {
    return { fee: null, distanceKm: null, note: 'International delivery — charges will be shared on WhatsApp' };
  }

  const pincode = String(address.pincode || '').trim();
  const point = (/^\d{6}$/.test(pincode) && (await geocodePincode(pincode))) || (address.stateCode && address.city && locateCity({ countryCode, ...address }));
  if (!point) return { fee: MIN_FEE, distanceKm: null, note: `Minimum delivery charge — couldn't locate pincode ${pincode || ''}`.trim() };

  const distanceKm = Math.round(haversineKm(ORIGIN, point) * ROAD_FACTOR);
  const fee = Math.max(MIN_FEE, distanceKm * PER_KM);
  return { fee, distanceKm, note: `Approx. ${distanceKm} km from our Jaipur studio` };
}

export const DELIVERY_RULES = { MIN_FEE, PER_KM };
