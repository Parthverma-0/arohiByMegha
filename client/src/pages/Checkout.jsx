import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useCart } from '../api/cart.js';
import { usePlaceWhatsappOrder, usePreviewCoupon, useDeliveryQuote } from '../api/orders.js';
import { useCountries, useStates, useCities } from '../api/locations.js';
import { apiErrorMessage } from '../api/client.js';
import { formatINR } from '../components/ui/PriceTag.jsx';
import { useAuthStore } from '../store/authStore.js';

const OTHER_CITY = '__other__';

const emptyAddress = {
  fullName: '', phone: '', email: '', line1: '', line2: '',
  country: 'India', countryCode: 'IN', state: '', stateCode: '', city: '', pincode: '',
};

export default function Checkout() {
  const { data: cart, isPending: isLoading } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [cityIsOther, setCityIsOther] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const navigate = useNavigate();
  const user = useAuthStore((st) => st.user);

  // The invoice is emailed to this address, so pre-fill it for logged-in shoppers.
  useEffect(() => {
    if (user?.email) setAddress((prev) => (prev.email ? prev : { ...prev, email: user.email }));
  }, [user?.email]);

  const { data: countries = [] } = useCountries();
  const { data: states = [] } = useStates(address.countryCode);
  const { data: cities = [] } = useCities(address.countryCode, address.stateCode);
  const quote = useDeliveryQuote({ address, couponCode: coupon?.code, cartSubtotal: cart?.subtotal });
  const placeOrder = usePlaceWhatsappOrder();
  const previewCoupon = usePreviewCoupon();

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-20">Loading...</div>;
  if (!cart?.items?.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-charcoal/60">Your bag is empty.</p>
      </div>
    );
  }

  const isIndia = address.countryCode === 'IN';
  const subtotal = cart.subtotal;
  const discount = coupon?.discount || 0;
  const q = quote.data;
  const total = q ? q.total : Math.max(0, subtotal - discount);

  let deliveryLabel = isIndia ? 'Enter pincode' : 'Select country';
  if (quote.isFetching) deliveryLabel = 'Calculating…';
  else if (quote.isError) deliveryLabel = '—';
  else if (q?.delivery?.feePending) deliveryLabel = 'Confirmed on WhatsApp';
  else if (q) deliveryLabel = q.shippingFee > 0 ? formatINR(q.shippingFee) : 'Free';

  function updateField(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  function selectCountry(code) {
    const country = countries.find((c) => c.code === code);
    setCityIsOther(false);
    setAddress((prev) => ({ ...prev, countryCode: code, country: country?.name || '', stateCode: '', state: '', city: '' }));
  }

  function selectState(code) {
    const state = states.find((s) => s.code === code);
    setCityIsOther(false);
    setAddress((prev) => ({ ...prev, stateCode: code, state: state?.name || '', city: '' }));
  }

  function selectCity(value) {
    setCityIsOther(value === OTHER_CITY);
    updateField('city', value === OTHER_CITY ? '' : value);
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    try {
      const result = await previewCoupon.mutateAsync(couponCode.trim());
      setCoupon(result);
      toast.success(`Coupon applied: -${formatINR(result.discount)}`);
    } catch (err) {
      setCoupon(null);
      toast.error(apiErrorMessage(err, 'Invalid coupon'));
    }
  }

  async function submit() {
    for (const field of ['fullName', 'phone', 'line1', 'country', 'state', 'city', 'pincode']) {
      if (!address[field]?.trim()) return toast.error('Please fill in all required address fields');
    }
    if (isIndia && !/^\d{6}$/.test(address.pincode.trim())) return toast.error('Please enter a valid 6-digit pincode');
    if (!/^\S+@\S+\.\S+$/.test(address.email.trim())) {
      return toast.error('Please enter a valid email — your invoice will be sent there');
    }

    try {
      const { order, whatsappUrl } = await placeOrder.mutateAsync({ shippingAddress: address, couponCode: coupon?.code });
      navigate(`/order-confirmation/${order._id}`, { state: { order, whatsappUrl } });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not place order'));
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <Helmet><title>Checkout | Arohi by Megha</title></Helmet>
      <h1 className="section-heading mb-8">Checkout</h1>

      <div className="grid md:grid-cols-[1fr_340px] gap-10">
        <div>
          <h2 className="font-medium mb-4">Shipping Address</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="input-field" placeholder="Full Name*" value={address.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
            <input className="input-field" type="tel" placeholder="Phone (WhatsApp)*" value={address.phone} onChange={(e) => updateField('phone', e.target.value)} />
            <input className="input-field sm:col-span-2" type="email" placeholder="Email* (your invoice is sent here)" value={address.email} onChange={(e) => updateField('email', e.target.value)} />
            <input className="input-field sm:col-span-2" placeholder="House / Flat, Street*" value={address.line1} onChange={(e) => updateField('line1', e.target.value)} />
            <input className="input-field sm:col-span-2" placeholder="Area, Landmark" value={address.line2} onChange={(e) => updateField('line2', e.target.value)} />

            <select className="input-field" value={address.countryCode} onChange={(e) => selectCountry(e.target.value)} aria-label="Country">
              {!countries.length && <option value="IN">India</option>}
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {states.length ? (
              <select className="input-field" value={address.stateCode} onChange={(e) => selectState(e.target.value)} aria-label="State">
                <option value="">State*</option>
                {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            ) : (
              <input className="input-field" placeholder="State / Region*" value={address.state} onChange={(e) => updateField('state', e.target.value)} />
            )}

            {cities.length && !cityIsOther ? (
              <select className="input-field" value={address.city} onChange={(e) => selectCity(e.target.value)} aria-label="City">
                <option value="">City*</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value={OTHER_CITY}>My city isn't listed</option>
              </select>
            ) : (
              <input
                className="input-field"
                placeholder={address.stateCode || !states.length ? 'City / Town*' : 'Select a state first'}
                disabled={Boolean(states.length) && !address.stateCode}
                value={address.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
            )}
            <input
              className="input-field"
              inputMode={isIndia ? 'numeric' : 'text'}
              maxLength={isIndia ? 6 : 10}
              placeholder={isIndia ? 'Pincode*' : 'Postal Code*'}
              value={address.pincode}
              onChange={(e) => updateField('pincode', e.target.value)}
            />
          </div>

          <h2 className="font-medium mt-8 mb-4">Payment</h2>
          <div className="border border-charcoal/15 rounded-lg p-4 text-sm text-charcoal/80 space-y-2">
            <p className="font-medium text-charcoal">Pay by UPI QR code on WhatsApp</p>
            <p>
              When you place the order, WhatsApp opens with your order details already filled in — just hit send.
              We'll reply with our QR code, and your order is confirmed as soon as we receive the payment.
            </p>
          </div>
        </div>

        <div className="bg-blush rounded-lg p-6 h-fit space-y-3">
          <div className="flex gap-2">
            <input className="input-field !py-2 text-sm" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <button className="btn-outline !px-4 !py-2 text-sm" onClick={applyCoupon} disabled={previewCoupon.isPending}>Apply</button>
          </div>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-gold-dark"><span>Discount</span><span>-{formatINR(discount)}</span></div>}
          <div className="flex justify-between text-sm"><span>Delivery</span><span>{deliveryLabel}</span></div>
          {q?.delivery?.note && !quote.isFetching && <p className="text-xs text-charcoal/60 -mt-1">{q.delivery.note}</p>}
          {quote.isError && <p className="text-xs text-red-700 -mt-1">{apiErrorMessage(quote.error, 'Could not work out delivery')}</p>}
          <div className="flex justify-between font-medium text-base border-t border-charcoal/15 pt-3">
            <span>Total</span>
            <span>{formatINR(total)}{q?.delivery?.feePending ? ' + delivery' : ''}</span>
          </div>
          <p className="text-xs text-charcoal/60">Free delivery on orders of ₹500 and above. Below that, ₹9 per km (minimum ₹90) from Jaipur.</p>
          <button className="btn-primary w-full mt-2" onClick={submit} disabled={placeOrder.isPending || quote.isFetching}>
            {placeOrder.isPending ? 'Placing order…' : 'Place Order on WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
