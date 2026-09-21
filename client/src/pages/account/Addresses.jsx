import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '../../api/client.js';
import { useAddAddress } from '../../api/user.js';

const emptyAddress = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

export default function Addresses() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const qc = useQueryClient();
  const addAddress = useAddAddress();

  const { data: addresses = [] } = useQuery({
    queryKey: ['me-addresses'],
    queryFn: async () => (await api.get('/auth/me')).data.user.addresses,
  });

  async function submit(e) {
    e.preventDefault();
    try {
      await addAddress.mutateAsync(form);
      qc.invalidateQueries({ queryKey: ['me-addresses'] });
      setForm(emptyAddress);
      setShowForm(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <ul className="space-y-3 mb-6">
        {addresses.map((addr) => (
          <li key={addr._id} className="border border-charcoal/10 rounded-lg p-4 text-sm">
            <p className="font-medium">{addr.label} {addr.isDefault && <span className="text-xs text-gold-dark">(Default)</span>}</p>
            <p>{addr.fullName} · {addr.phone}</p>
            <p className="text-charcoal/70">{addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}</p>
          </li>
        ))}
        {addresses.length === 0 && <p className="text-charcoal/60">No saved addresses yet.</p>}
      </ul>

      {showForm ? (
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <input className="input-field" placeholder="Full Name*" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input className="input-field" placeholder="Phone*" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input-field sm:col-span-2" placeholder="Address Line 1*" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <input className="input-field sm:col-span-2" placeholder="Address Line 2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <input className="input-field" placeholder="City*" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input-field" placeholder="State*" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input className="input-field" placeholder="Pincode*" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default
          </label>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="btn-primary">Save Address</button>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn-outline" onClick={() => setShowForm(true)}>+ Add New Address</button>
      )}
    </div>
  );
}
