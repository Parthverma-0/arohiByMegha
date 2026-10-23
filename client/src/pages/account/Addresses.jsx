import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../api/client.js';
import { useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress } from '../../api/user.js';
import { useAuthStore } from '../../store/authStore.js';
import AddressForm from '../../components/AddressForm.jsx';
import AddressCard from '../../components/AddressCard.jsx';

export default function Addresses() {
  const user = useAuthStore((s) => s.user);
  const { data: addresses = [], isPending } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const [editing, setEditing] = useState(null); // null | 'new' | address id

  async function save(payload) {
    try {
      if (editing === 'new') await addAddress.mutateAsync(payload);
      else await updateAddress.mutateAsync({ id: editing, payload });
      setEditing(null);
      toast.success('Address saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the address'));
    }
  }

  async function makeDefault(id) {
    try {
      await updateAddress.mutateAsync({ id, payload: { isDefault: true } });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteAddress.mutateAsync(id);
      toast.success('Address deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (isPending) return <p className="text-charcoal/60">Loading…</p>;

  return (
    <div>
      <p className="text-sm text-charcoal/60 mb-5">Save your addresses once, then just pick one at checkout.</p>
      <ul className="space-y-3 mb-6">
        {addresses.map((addr) => (
          <li key={addr._id} className="border border-charcoal/10 rounded-lg p-4">
            {editing === addr._id ? (
              <AddressForm initial={addr} onSubmit={save} onCancel={() => setEditing(null)} busy={updateAddress.isPending} />
            ) : (
              <AddressCard address={addr}>
                <div className="flex gap-4 mt-3 text-sm">
                  <button className="underline" onClick={() => setEditing(addr._id)}>Edit</button>
                  {!addr.isDefault && <button className="underline" onClick={() => makeDefault(addr._id)}>Set as default</button>}
                  <button className="underline text-red-700" onClick={() => remove(addr._id)}>Delete</button>
                </div>
              </AddressCard>
            )}
          </li>
        ))}
        {addresses.length === 0 && editing !== 'new' && <p className="text-charcoal/60">No saved addresses yet.</p>}
      </ul>

      {editing === 'new' ? (
        <div className="border border-charcoal/10 rounded-lg p-4">
          <AddressForm defaultName={user?.name} onSubmit={save} onCancel={() => setEditing(null)} busy={addAddress.isPending} />
        </div>
      ) : (
        <button className="btn-outline" onClick={() => setEditing('new')}>+ Add New Address</button>
      )}
    </div>
  );
}
