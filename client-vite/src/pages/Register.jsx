import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthShell, { AuthField, AuthError, authInput } from '@/components/auth/AuthShell';
import GoogleButton, { OrDivider } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/button';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Back to where the traveller was (e.g. the group trip they want to join).
  const next = location.state?.from || '/my-trips';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
      setError(err.response?.data?.error || 'Google sign-up failed. Please try again.');
    }
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      finish(await axios.post(`${API_URL}/auth/register`, form));
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error === 'Validation failed' && d.issues?.length ? d.issues.map((i) => i.message).join(' · ') : d?.error || 'We couldn’t create your account. Please try again.');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title="Create your account"
      seoTitle="Create an account"
      lede="Track your quotes, join group trips and share your referral link with friends."
      footer={<>Already have an account? <Link to="/login" state={location.state} className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">Sign in</Link></>}
    >
      <GoogleButton onCredential={onGoogle} text="signup_with" />
      <OrDivider />
      <form onSubmit={submit} className="space-y-4">
        <AuthError>{error}</AuthError>
        <AuthField label="Full name">
          <input value={form.name} onChange={set('name')} required autoComplete="name" className={authInput} />
        </AuthField>
        <AuthField label="Email">
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" className={authInput} />
        </AuthField>
        <AuthField label="Phone / WhatsApp (optional)" hint="With country code, e.g. +44 7…">
          <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" className={authInput} />
        </AuthField>
        <AuthField label="Password" hint="At least 8 characters">
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" className={authInput} />
        </AuthField>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  );
}
