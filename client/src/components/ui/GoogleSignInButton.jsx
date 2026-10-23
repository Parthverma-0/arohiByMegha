import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useGoogleConfig, useGoogleLogin } from '../../api/auth.js';
import { apiErrorMessage } from '../../api/client.js';

let scriptPromise;
function loadGoogleScript() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      if (window.google?.accounts?.id) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        scriptPromise = null;
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export default function GoogleSignInButton({ onSuccess, text = 'continue_with' }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const { data: config, isError: configFailed } = useGoogleConfig();
  const clientId = config?.clientId;
  const googleLogin = useGoogleLogin();
  // Google keeps the first callback it was given, so route it through a ref to always reach the latest props.
  const handleRef = useRef();
  handleRef.current = async ({ credential }) => {
    try {
      await googleLogin.mutateAsync(credential);
      onSuccess?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Google sign-in failed'));
    }
  };

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    loadGoogleScript().then((ok) => {
      const el = containerRef.current;
      if (cancelled || !el) return;
      if (!ok) return setFailed(true);
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => handleRef.current(response),
      });
      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text,
        width: Math.min(el.offsetWidth || 400, 400),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (failed || configFailed) {
    return (
      <p className="text-center text-sm text-red-700">
        Google sign-in couldn't load. Please check your connection and refresh the page.
      </p>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="flex justify-center min-h-[44px]" />
      {googleLogin.isPending && <p className="text-center text-sm text-charcoal/60 mt-3">Signing you in…</p>}
    </div>
  );
}
