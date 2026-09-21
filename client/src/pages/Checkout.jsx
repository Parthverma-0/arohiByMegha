import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useCart } from '../api/cart.js';
import { usePlaceCodOrder, useCreateRazorpayOrder, useVerifyRazorpayOrder, usePreviewCoupon } from '../api/orders.js';
import { apiErrorMessage } from '../api/client.js';
import { formatINR } from '../components/ui/PriceTag.jsx';

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

const emptyAddress = { fullName: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const { data: cart, isLoading } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  const placeCod = usePlaceCodOrder();
  const createRazorpayOrder = useCreateRazorpayOrder();
  const verifyRazorpay = useVerifyRazorpayOrder();
  const previewCoupon = usePreviewCoupon();

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-20">Loading...</div>;
  if (!cart?.items?.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-charcoal/60">Your bag is empty.</p>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  function updateField(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }));
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

  async function placeOrder() {
    for (const field of ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']) {
      if (!address[field]?.trim()) return toast.error('Please fill in all required address fields');
    }

    setPlacing(true);
    try {
      if (paymentMethod === 'cod') {
        const order = await placeCod.mutateAsync({ shippingAddress: address, couponCode: coupon?.code });
        navigate(`/order-confirmation/${order._id}`, { state: { order } });
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load payment gateway. Please try Cash on Delivery.');
        return;
      }

      const { razorpayOrderId, amount, keyId } = await createRazorpayOrder.mutateAsync({ couponCode: coupon?.code });

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: 'INR',
        name: 'Arohi by Megha',
        order_id: razorpayOrderId,
        prefill: { name: address.fullName, contact: address.phone, email: address.email },
        theme: { color: '#A9812F' },
        handler: async (response) => {
          try {
            const order = await verifyRazorpay.mutateAsync({
              shippingAddress: address,
              couponCode: coupon?.code,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(`/order-confirmation/${order._id}`, { state: { order } });
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Payment verification failed'));
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      });
      rzp.open();
      return;
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not place order'));
    } finally {
      if (paymentMethod === 'cod') setPlacing(false);
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
            <input className="input-field" placeholder="Phone*" value={address.phone} onChange={(e) => updateField('phone', e.target.value)} />
            <input className="input-field sm:col-span-2" placeholder="Email (for order updates)" value={address.email} onChange={(e) => updateField('email', e.target.value)} />
            <input className="input-field sm:col-span-2" placeholder="Address Line 1*" value={address.line1} onChange={(e) => updateField('line1', e.target.value)} />
            <input className="input-field sm:col-span-2" placeholder="Address Line 2" value={address.line2} onChange={(e) => updateField('line2', e.target.value)} />
            <input className="input-field" placeholder="City*" value={address.city} onChange={(e) => updateField('city', e.target.value)} />
            <input className="input-field" placeholder="State*" value={address.state} onChange={(e) => updateField('state', e.target.value)} />
            <input className="input-field" placeholder="Pincode*" value={address.pincode} onChange={(e) => updateField('pincode', e.target.value)} />
          </div>

          <h2 className="font-medium mt-8 mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 border border-charcoal/15 rounded-lg p-4 cursor-pointer">
              <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              Cash on Delivery
            </label>
            <label className="flex items-center gap-3 border border-charcoal/15 rounded-lg p-4 cursor-pointer">
              <input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
              UPI / Card / Net Banking (Razorpay)
            </label>
          </div>
        </div>

        <div className="bg-blush rounded-lg p-6 h-fit space-y-3">
          <div className="flex gap-2">
            <input className="input-field !py-2 text-sm" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <button className="btn-outline !px-4 !py-2 text-sm" onClick={applyCoupon} disabled={previewCoupon.isPending}>Apply</button>
          </div>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-gold-dark"><span>Discount</span><span>-{formatINR(discount)}</span></div>}
          <div className="flex justify-between text-sm"><span>Shipping</span><span>Free</span></div>
          <div className="flex justify-between font-medium text-base border-t border-charcoal/15 pt-3"><span>Total</span><span>{formatINR(total)}</span></div>
          <button className="btn-primary w-full mt-2" onClick={placeOrder} disabled={placing}>
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
