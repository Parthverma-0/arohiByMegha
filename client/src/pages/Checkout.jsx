import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useCart } from '../api/cart.js';
import { useInitiateRazorpayPayment, useVerifyRazorpayPayment, usePreviewCoupon, useDeliveryQuote } from '../api/orders.js';
import { useAddresses, useAddAddress } from '../api/user.js';
import { apiErrorMessage } from '../api/client.js';
import { formatINR } from '../components/ui/PriceTag.jsx';
import AddressForm from '../components/AddressForm.jsx';
import AddressCard from '../components/AddressCard.jsx';
import { useAuthStore } from '../store/authStore.js';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const user = useAuthStore((st) => st.user);
  const isHydrating = useAuthStore((st) => st.isHydrating);
  const { data: cart, isPending: cartLoading } = useCart();
  const { data: addresses = [], isPending: addressesLoading } = useAddresses();
  const addAddress = useAddAddress();
  const [selectedId, setSelectedId] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();

  // Pre-select the default address (or the first one) once addresses load.
  useEffect(() => {
    if (selectedId && addresses.some((a) => a._id === selectedId)) return;
    const preferred = addresses.find((a) => a.isDefault) || addresses[0];
    setSelectedId(preferred?._id || null);
  }, [addresses, selectedId]);

  const quote = useDeliveryQuote({ addressId: selectedId, couponCode: coupon?.code, cartSubtotal: cart?.subtotal });
  const initiateRazorpay = useInitiateRazorpayPayment();
  const verifyRazorpay = useVerifyRazorpayPayment();
  const previewCoupon = usePreviewCoupon();

  if (isHydrating) return <div className="max-w-4xl mx-auto px-4 py-20">Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  if (cartLoading || addressesLoading) return <div className="max-w-4xl mx-auto px-4 py-20">Loading...</div>;
  if (!cart?.items?.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-charcoal/60">Your bag is empty.</p>
      </div>
    );
  }

  const showAddressForm = addingAddress || addresses.length === 0;
  const subtotal = cart.subtotal;
  const discount = coupon?.discount || 0;
  const q = quote.data;
  const total = q ? q.total : Math.max(0, subtotal - discount);

  let deliveryLabel = 'Choose an address';
  if (quote.isFetching) deliveryLabel = 'Calculating…';
  else if (quote.isError) deliveryLabel = '—';
  else if (q?.delivery?.feePending) deliveryLabel = 'Not available';
  else if (q) deliveryLabel = q.shippingFee > 0 ? formatINR(q.shippingFee) : 'Free';

  async function saveNewAddress(payload) {
    try {
      const { address } = await addAddress.mutateAsync(payload);
      setSelectedId(address._id);
      setAddingAddress(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the address'));
    }
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
    if (!selectedId) return toast.error('Please choose a delivery address');

    setPlacing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load the payment gateway. Please check your connection and try again.');
        setPlacing(false);
        return;
      }

      const { razorpayOrderId, amount, keyId } = await initiateRazorpay.mutateAsync({
        addressId: selectedId,
        couponCode: coupon?.code,
      });
      const address = addresses.find((a) => a._id === selectedId);

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: 'INR',
        name: 'Arohi by Megha',
        order_id: razorpayOrderId,
        prefill: { name: address?.fullName, contact: address?.phone, email: user.email },
        theme: { color: '#A9812F' },
        // The server re-checks the payment with Razorpay before creating the order.
        handler: async (response) => {
          setConfirming(true);
          try {
            const data = await verifyRazorpay.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (data.order) navigate(`/order-confirmation/${data.order._id}`, { state: { order: data.order } });
            else toast(data.message, { duration: 8000 });
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Payment verification failed'));
          } finally {
            setConfirming(false);
            setPlacing(false);
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      });
      // Razorpay keeps its window open after a failed attempt so the shopper can
      // retry; tell them why it failed rather than leaving them guessing.
      rzp.on('payment.failed', (response) => {
        toast.error(response?.error?.description || 'Payment failed. Please try again or use another method.', { duration: 8000 });
      });
      rzp.open();
      // Left in the "placing" state on purpose — the Razorpay modal now owns
      // resetting it, via either the handler above or modal.ondismiss.
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start payment'));
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <Helmet><title>Checkout | Arohi by Megha</title></Helmet>
      {confirming && (
        <div className="fixed inset-0 z-50 bg-ivory/95 flex flex-col items-center justify-center text-center px-6">
          <div className="w-10 h-10 border-2 border-gold-dark border-t-transparent rounded-full animate-spin" />
          <p className="mt-5 font-display text-2xl">Confirming your payment…</p>
          <p className="mt-2 text-sm text-charcoal/60">Please don't close or refresh this page.</p>
        </div>
      )}
      <h1 className="section-heading mb-8">Checkout</h1>

      <div className="grid md:grid-cols-[1fr_340px] gap-10">
        <div>
          <h2 className="font-medium mb-4">Deliver to</h2>

          {addresses.length > 0 && (
            <div className="space-y-3" role="radiogroup" aria-label="Delivery address">
              {addresses.map((addr) => {
                const selected = addr._id === selectedId;
                return (
                  <label
                    key={addr._id}
                    className={`flex gap-3 items-start border rounded-lg p-4 cursor-pointer transition-colors ${selected ? 'border-gold-dark bg-blush/40' : 'border-charcoal/15 hover:border-charcoal/30'}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1 accent-[#A9812F]"
                      checked={selected}
                      onChange={() => setSelectedId(addr._id)}
                    />
                    <AddressCard address={addr} />
                  </label>
                );
              })}
            </div>
          )}

          {showAddressForm ? (
            <div className={`border border-charcoal/15 rounded-lg p-4 ${addresses.length ? 'mt-4' : ''}`}>
              <p className="font-medium text-sm mb-4">{addresses.length ? 'New address' : 'Add your delivery address'}</p>
              <AddressForm
                defaultName={user.name}
                initial={addresses.length ? undefined : { isDefault: true }}
                onSubmit={saveNewAddress}
                onCancel={addresses.length ? () => setAddingAddress(false) : undefined}
                submitLabel="Save & Deliver Here"
                busy={addAddress.isPending}
              />
            </div>
          ) : (
            <button className="mt-4 text-sm underline underline-offset-4" onClick={() => setAddingAddress(true)}>
              + Add a new address
            </button>
          )}

          <p className="text-xs text-charcoal/60 mt-4">Your invoice will be emailed to {user.email}.</p>

          <h2 className="font-medium mt-8 mb-4">Payment</h2>
          <div className="border border-charcoal/15 rounded-lg p-4 text-sm text-charcoal/80 space-y-2">
            <p className="font-medium text-charcoal">UPI / Card / Net Banking / Wallet</p>
            <p>You'll pay securely through Razorpay. Your order is confirmed as soon as the payment goes through.</p>
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
            <span>{formatINR(total)}</span>
          </div>
          <p className="text-xs text-charcoal/60">Free delivery on orders of ₹399 and above. Below that, a flat ₹90 delivery charge applies.</p>
          <button
            className="btn-primary w-full mt-2"
            onClick={submit}
            disabled={placing || !selectedId || quote.isFetching || q?.delivery?.feePending}
          >
            {placing ? 'Opening payment…' : q ? `Pay ${formatINR(total)}` : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
