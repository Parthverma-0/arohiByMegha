import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useLogin } from '../api/auth.js';
import { apiErrorMessage } from '../api/client.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    try {
      await login.mutateAsync(form);
      navigate(location.state?.from || '/account');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Invalid email or password'));
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <Helmet><title>Login | Arohi by Megha</title></Helmet>
      <h1 className="section-heading text-center mb-8">Welcome Back</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required type="email" placeholder="Email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" placeholder="Password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
          {login.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-sm text-charcoal/60 mt-6">
        New here? <Link to="/signup" className="underline">Create an account</Link>
      </p>
    </div>
  );
}
