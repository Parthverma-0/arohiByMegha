import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useSignup } from '../api/auth.js';
import { apiErrorMessage } from '../api/client.js';

const initial = { name: '', email: '', phone: '', password: '', marketingConsent: false };

export default function Signup() {
  const [form, setForm] = useState(initial);
  const signup = useSignup();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      await signup.mutateAsync(form);
      navigate('/account');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create your account'));
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <Helmet><title>Sign Up | Arohi by Megha</title></Helmet>
      <h1 className="section-heading text-center mb-8">Create Your Account</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full Name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required placeholder="Phone Number" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="password" placeholder="Password (min 8 characters)" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label className="flex items-start gap-2 text-sm text-charcoal/70">
          <input type="checkbox" checked={form.marketingConsent} onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })} className="mt-1" />
          I'd like to receive offers, launches and updates by email/SMS/WhatsApp.
        </label>
        <button type="submit" className="btn-primary w-full" disabled={signup.isPending}>
          {signup.isPending ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-charcoal/60 mt-6">
        Already have an account? <Link to="/login" className="underline">Login</Link>
      </p>
    </div>
  );
}
