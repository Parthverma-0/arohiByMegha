import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminLogin, useSetupTwoFactor, useEnableTwoFactor, useVerifyTwoFactor } from '../api/auth.js';
import { apiErrorMessage } from '../api/client.js';

export default function Login() {
  const [step, setStep] = useState('password'); // password | setup | verify
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [tempToken, setTempToken] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const login = useAdminLogin();
  const setupTwoFactor = useSetupTwoFactor();
  const enableTwoFactor = useEnableTwoFactor();
  const verifyTwoFactor = useVerifyTwoFactor();

  async function submitPassword(e) {
    e.preventDefault();
    try {
      const data = await login.mutateAsync(credentials);
      setTempToken(data.tempToken);
      if (data.totpEnabled) {
        setStep('verify');
      } else {
        const setup = await setupTwoFactor.mutateAsync(data.tempToken);
        setQrDataUrl(setup.qrDataUrl);
        setStep('setup');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Invalid email or password'));
    }
  }

  async function submitSetupCode(e) {
    e.preventDefault();
    try {
      await enableTwoFactor.mutateAsync({ tempToken, code });
      navigate('/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Invalid code'));
    }
  }

  async function submitVerifyCode(e) {
    e.preventDefault();
    try {
      await verifyTwoFactor.mutateAsync({ tempToken, code });
      navigate('/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Invalid code'));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blush px-4">
      <div className="card w-full max-w-sm">
        <h1 className="font-display text-2xl mb-1 text-center">Arohi Admin</h1>
        <p className="text-center text-sm text-charcoal/60 mb-6">Secure sign in</p>

        {step === 'password' && (
          <form onSubmit={submitPassword} className="space-y-4">
            <input required type="email" placeholder="Email" className="input-field" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} />
            <input required type="password" placeholder="Password" className="input-field" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} />
            <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
              {login.isPending ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'setup' && (
          <form onSubmit={submitSetupCode} className="space-y-4 text-center">
            <p className="text-sm text-charcoal/70">
              First login — scan this QR code with Google Authenticator / Authy, then enter the 6-digit code to finish setting up two-factor authentication.
            </p>
            {qrDataUrl && <img src={qrDataUrl} alt="2FA QR code" className="mx-auto w-40 h-40" />}
            <input required maxLength={6} placeholder="6-digit code" className="input-field text-center tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="submit" className="btn-primary w-full" disabled={enableTwoFactor.isPending}>
              {enableTwoFactor.isPending ? 'Verifying...' : 'Enable & Login'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={submitVerifyCode} className="space-y-4 text-center">
            <p className="text-sm text-charcoal/70">Enter the 6-digit code from your authenticator app.</p>
            <input required maxLength={6} placeholder="6-digit code" className="input-field text-center tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="submit" className="btn-primary w-full" disabled={verifyTwoFactor.isPending}>
              {verifyTwoFactor.isPending ? 'Verifying...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
