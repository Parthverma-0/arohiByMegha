import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import GoogleSignInButton from '../components/ui/GoogleSignInButton.jsx';

export default function Signup() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <Helmet><title>Sign Up | Arohi by Megha</title></Helmet>
      <h1 className="section-heading text-center mb-3">Create Your Account</h1>
      <p className="text-center text-sm text-charcoal/60 mb-8">Sign up in one tap with Google. No password to remember.</p>
      <GoogleSignInButton text="signup_with" onSuccess={() => navigate('/account')} />
      <p className="text-center text-sm text-charcoal/60 mt-8">
        Already have an account? <Link to="/login" className="underline">Login</Link>
      </p>
    </div>
  );
}
