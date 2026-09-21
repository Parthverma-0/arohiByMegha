import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '../api/misc.js';
import { apiErrorMessage } from '../api/client.js';

const emptyForm = { code: '', type: 'percent', value: '', minOrderValue: 0, maxDiscount: '', expiresAt: '', usageLimit: '', isActive: true };

export default function Coupons() {
  const { data: coupons = [] } = useAdminCoupons();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  function startNew() {
    setEditing('new');
    setForm(emptyForm);
  }

  function startEdit(c) {
    setEditing(c._id);
    setForm({
      code: c.code, type: c.type, value: c.value, minOrderValue: c.minOrderValue,
      maxDiscount: c.maxDiscount || '', expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      usageLimit: c.usageLimit || '', isActive: c.isActive,
    });
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      value: Number(form.value),
      minOrderValue: Number(form.minOrderValue) || 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      expiresAt: form.expiresAt || null,
    };
    try {
      if (editing === 'new') await createCoupon.mutateAsync(payload);
      else await updateCoupon.mutateAsync({ id: editing, payload });
      toast.success('Saved');
      setEditing(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function remove(id) {
    if (!confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon.mutateAsync(id);
      toast.success('Deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl">Coupons</h1>
        <button className="btn-primary" onClick={startNew}>+ New Coupon</button>
      </div>

      {editing && (
        <form onSubmit={submit} className="card mb-8 space-y-4 max-w-lg">
          <input required placeholder="Coupon Code" className="input-field uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent off</option>
              <option value="flat">Flat amount off</option>
            </select>
            <input required type="number" placeholder="Value" className="input-field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Min order value" className="input-field" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
            <input type="number" placeholder="Max discount (optional)" className="input-field" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" placeholder="Expires" className="input-field" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            <input type="number" placeholder="Usage limit (optional)" className="input-field" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
          </label>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <table className="table-base">
        <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c._id}>
              <td>{c.code}</td>
              <td>{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
              <td>{c.timesUsed}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
              <td>{c.isActive ? 'Yes' : 'No'}</td>
              <td className="space-x-3">
                <button className="text-sm underline" onClick={() => startEdit(c)}>Edit</button>
                <button className="text-sm underline text-red-600" onClick={() => remove(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
