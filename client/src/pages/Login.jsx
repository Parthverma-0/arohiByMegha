import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import GoogleSignInButton from '../components/ui/GoogleSignInButton.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <Helmet><title>Login | Arohi by Megha</title></Helmet>
      <h1 className="section-heading text-center mb-3">Welcome Back</h1>
      <p className="text-center text-sm text-charcoal/60 mb-8">Log in with your Google account to see your orders and saved addresses.</p>
      <GoogleSignInButton onSuccess={() => navigate(location.state?.from || '/account')} />
      <p className="text-center text-sm text-charcoal/60 mt-8">
        New here? <Link to="/signup" className="underline">Create an account</Link>
      </p>
    </div>
  );
}
