import toast from 'react-hot-toast';
import { useDownloadInvoice, useEmailInvoice } from '../api/misc.js';
import { apiErrorMessage } from '../api/client.js';

// Invoice number + email status + Download / Email buttons for one order.
// Shared by the Invoices list and the Order detail page.
export default function InvoiceActions({ order, showStatus = false }) {
  const download = useDownloadInvoice();
  const email = useEmailInvoice();
  const inv = order.invoice || {};

  async function handleEmail() {
    const to = order.shippingAddress?.email;
    if (!to) return toast.error('This order has no customer email address');
    if (inv.emailedAt && !confirm(`The invoice was already emailed to ${inv.emailedTo}. Send it again?`)) return;
    try {
      const res = await email.mutateAsync(order._id);
      toast.success(`Invoice emailed to ${res.sentTo}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not email the invoice'));
    }
  }

  async function handleDownload() {
    try {
      await download.mutateAsync(order._id);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not generate the invoice'));
    }
  }

  return (
    <div className="space-y-2">
      {showStatus && (
        <div className="text-sm space-y-1">
          <p>
            Invoice No: <span className="font-medium">{inv.number || 'Not issued yet'}</span>
          </p>
          <InvoiceEmailStatus order={order} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-outline !py-1.5 !px-3 text-xs" onClick={handleDownload} disabled={download.isPending}>
          {download.isPending ? 'Preparing…' : 'Download PDF'}
        </button>
        <button type="button" className="btn-outline !py-1.5 !px-3 text-xs" onClick={handleEmail} disabled={email.isPending}>
          {email.isPending ? 'Sending…' : inv.emailedAt ? 'Resend email' : 'Email to customer'}
        </button>
      </div>
    </div>
  );
}

export function InvoiceEmailStatus({ order }) {
  const inv = order.invoice || {};
  if (inv.emailedAt) {
    return (
      <p className="text-sm text-green-700">
        Emailed to {inv.emailedTo} on {new Date(inv.emailedAt).toLocaleString('en-IN')}
      </p>
    );
  }
  if (inv.emailError) return <p className="text-sm text-red-700">Email failed: {inv.emailError}</p>;
  if (order.paymentStatus !== 'paid') {
    return <p className="text-sm text-charcoal/60">Will be emailed automatically once paid{order.paymentMethod === 'cod' ? ' (when marked Delivered)' : order.paymentMethod === 'manual_upi' ? ' (when you approve the payment)' : ''}</p>;
  }
  return <p className="text-sm text-charcoal/60">Not emailed yet</p>;
}
