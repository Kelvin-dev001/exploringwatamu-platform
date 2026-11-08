import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthShell, { AuthField, AuthError, authInput } from '@/components/auth/AuthShell';
import GoogleButton, { OrDivider } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.from || '/my-trips';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = (res) => {
    login(res.data.token, res.data.user);
    navigate(next, { replace: true });
  };

  const onGoogle = async (credential) => {
    setError('');
    setLoading(true);
    try {
      finish(await axios.post(`${API_URL}/auth/google`, { credential }));
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    }
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      finish(await axios.post(`${API_URL}/auth/login`, form));
    } catch (err) {
      setError(err.response?.data?.error || 'Sign-in failed. Check your email and password.');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title="Welcome back"
      seoTitle="Sign in"
      lede="Sign in to see your quotes, group trips and referral rewards."
      footer={<>New here? <Link to="/register" className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">Create an account</Link></>}
    >
      <GoogleButton onCredential={onGoogle} />
      <OrDivider />
      <form onSubmit={submit} className="space-y-4">
        <AuthError>{error}</AuthError>
        <AuthField label="Email">
          <input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" className={authInput} />
        </AuthField>
        <AuthField label="Password">
          <input type="password" name="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" className={authInput} />
        </AuthField>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-lagoon-700 hover:underline">Forgot your password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </AuthShell>
  );
}
