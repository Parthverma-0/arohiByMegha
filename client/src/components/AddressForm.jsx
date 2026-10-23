import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCountries, useStates, useCities } from '../api/locations.js';
import SearchableSelect from './ui/SearchableSelect.jsx';

const OTHER_CITY = '__other__';
const LABELS = ['Home', 'Work', 'Other'];

const blank = {
  label: 'Home', fullName: '', phone: '', line1: '', line2: '',
  country: 'India', countryCode: 'IN', state: '', stateCode: '', city: '', pincode: '', isDefault: false,
};

export default function AddressForm({ initial, defaultName = '', onSubmit, onCancel, submitLabel = 'Save Address', busy }) {
  const [form, setForm] = useState(() => ({ ...blank, fullName: defaultName, ...initial }));
  const { data: countries = [] } = useCountries();
  const { data: states = [] } = useStates(form.countryCode);
  const { data: cities = [] } = useCities(form.countryCode, form.stateCode);
  const [cityIsOther, setCityIsOther] = useState(false);
  const isIndia = form.countryCode === 'IN';
  // An edited address may hold a city that isn't in the list; show it as typed text instead of a blank picker.
  const cityNotListed = cityIsOther || (form.city && cities.length > 0 && !cities.includes(form.city));

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  function selectCountry(code) {
    const country = countries.find((c) => c.code === code);
    setCityIsOther(false);
    setForm((prev) => ({ ...prev, countryCode: code, country: country?.name || '', stateCode: '', state: '', city: '' }));
  }

  function selectState(code) {
    const state = states.find((s) => s.code === code);
    setCityIsOther(false);
    setForm((prev) => ({ ...prev, stateCode: code, state: state?.name || '', city: '' }));
  }

  function selectCity(value) {
    setCityIsOther(value === OTHER_CITY);
    set('city', value === OTHER_CITY ? '' : value);
  }

  async function submit(e) {
    e.preventDefault();
    for (const field of ['fullName', 'phone', 'line1', 'state', 'city', 'pincode']) {
      if (!String(form[field] || '').trim()) return toast.error('Please fill in all required fields');
    }
    if (!/^\+?\d{10,14}$/.test(form.phone.replace(/[\s-]/g, ''))) return toast.error('Please enter a valid phone number');
    if (isIndia && !/^\d{6}$/.test(form.pincode.trim())) return toast.error('Please enter a valid 6-digit pincode');
    const { _id, createdAt, updatedAt, ...payload } = form;
    await onSubmit({ ...payload, phone: form.phone.replace(/[\s-]/g, ''), pincode: form.pincode.trim() });
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 flex gap-2">
        {LABELS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => set('label', label)}
            className={`px-4 py-1.5 rounded-full border text-sm ${form.label === label ? 'border-gold-dark bg-blush font-medium' : 'border-charcoal/20 text-charcoal/70'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <input className="input-field" placeholder="Full Name*" autoComplete="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
      <input className="input-field" type="tel" placeholder="Phone*" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      <input className="input-field sm:col-span-2" placeholder="House / Flat, Street*" autoComplete="address-line1" value={form.line1} onChange={(e) => set('line1', e.target.value)} />
      <input className="input-field sm:col-span-2" placeholder="Area, Landmark" autoComplete="address-line2" value={form.line2 || ''} onChange={(e) => set('line2', e.target.value)} />

      <SearchableSelect
        ariaLabel="Country"
        placeholder="Country*"
        value={form.countryCode}
        onChange={selectCountry}
        options={countries.length ? countries.map((c) => ({ value: c.code, label: c.name })) : [{ value: 'IN', label: 'India' }]}
      />
      {states.length ? (
        <SearchableSelect
          ariaLabel="State"
          placeholder="State* (type to search)"
          value={form.stateCode}
          onChange={selectState}
          options={states.map((s) => ({ value: s.code, label: s.name }))}
        />
      ) : (
        <input className="input-field" placeholder="State / Region*" value={form.state} onChange={(e) => set('state', e.target.value)} />
      )}

      {cities.length && !cityNotListed ? (
        <SearchableSelect
          ariaLabel="City"
          placeholder="City* (type to search)"
          value={form.city}
          onChange={selectCity}
          options={[
            ...cities.map((c) => ({ value: c, label: c })),
            { value: OTHER_CITY, label: "My city isn't listed", pinned: true },
          ]}
        />
      ) : (
        <input
          className="input-field"
          placeholder={form.stateCode || !states.length ? 'City / Town*' : 'Select a state first'}
          disabled={Boolean(states.length) && !form.stateCode}
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
        />
      )}
      <input
        className="input-field"
        inputMode={isIndia ? 'numeric' : 'text'}
        maxLength={isIndia ? 6 : 10}
        placeholder={isIndia ? 'Pincode*' : 'Postal Code*'}
        autoComplete="postal-code"
        value={form.pincode}
        onChange={(e) => set('pincode', e.target.value)}
      />

      <label className="sm:col-span-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} />
        Make this my default address
      </label>
      <div className="sm:col-span-2 flex gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
