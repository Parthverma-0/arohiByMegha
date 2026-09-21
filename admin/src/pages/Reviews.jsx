import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAdminReviews, useModerateReview } from '../api/misc.js';
import { apiErrorMessage } from '../api/client.js';

export default function Reviews() {
  const [status, setStatus] = useState('pending');
  const { data: reviews = [] } = useAdminReviews(status);
  const moderate = useModerateReview();

  async function act(id, newStatus) {
    try {
      await moderate.mutateAsync({ id, status: newStatus });
      toast.success(`Review ${newStatus}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl">Reviews</h1>
        <select className="input-field !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {reviews.length === 0 ? (
        <p className="text-charcoal/60">No reviews here.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r._id} className="card">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{r.product?.name}</p>
                  <p className="text-sm text-charcoal/60">by {r.user?.name} · Rating {r.rating}/5</p>
                </div>
                {status === 'pending' && (
                  <div className="space-x-3">
                    <button className="text-sm underline text-green-700" onClick={() => act(r._id, 'approved')}>Approve</button>
                    <button className="text-sm underline text-red-600" onClick={() => act(r._id, 'rejected')}>Reject</button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm">{r.title}</p>
              <p className="text-sm text-charcoal/70">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
