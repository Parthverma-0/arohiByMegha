import { useState } from 'react';
import toast from 'react-hot-toast';
import { useReviewPayment } from '../api/misc.js';
import { apiErrorMessage } from '../api/client.js';

// Approve / reject a UPI QR code payment taken over WhatsApp. Approving
// confirms the order and emails the invoice; rejecting cancels the order and
// puts its items back in stock.
export default function PaymentReview({ order, compact = false }) {
  const review = useReviewPayment();
  const [reference, setReference] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);

  async function submit(decision) {
    try {
      await review.mutateAsync({ id: order._id, decision, reference: reference.trim() || undefined });
      toast.success(decision === 'approve' ? `Payment approved — #${order.orderNumber} confirmed` : `#${order.orderNumber} cancelled, stock released`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setConfirmReject(false);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'mt-3'}`}>
      <input
        className={`input-field !py-1.5 text-sm ${compact ? '!w-40' : '!w-56'}`}
        placeholder="UPI ref / UTR (optional)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <button className="btn-primary !w-auto !py-1.5 !px-3 text-sm" disabled={review.isPending} onClick={() => submit('approve')}>
        Approve payment
      </button>
      {confirmReject ? (
        <>
          <button className="btn-outline !w-auto !py-1.5 !px-3 text-sm !border-red-400 !text-red-700" disabled={review.isPending} onClick={() => submit('reject')}>
            Confirm reject
          </button>
          <button className="text-sm underline" onClick={() => setConfirmReject(false)}>Keep</button>
        </>
      ) : (
        <button className="btn-outline !w-auto !py-1.5 !px-3 text-sm" disabled={review.isPending} onClick={() => setConfirmReject(true)}>
          Reject
        </button>
      )}
    </div>
  );
}

export function isAwaitingPayment(order) {
  return order.paymentMethod === 'manual_upi' && order.paymentStatus === 'pending' && order.currentStatus !== 'cancelled';
}

export function paymentMethodLabel(method) {
  return { cod: 'COD', razorpay: 'Razorpay', manual_upi: 'UPI QR' }[method] || method;
}
