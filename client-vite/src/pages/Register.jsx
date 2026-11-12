import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthShell, { AuthField, AuthError, authInput } from '@/components/auth/AuthShell';
import GoogleButton, { OrDivider } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import messages from '@/locales/account';
import { apiError } from '@/lib/apiErrors';

export default function Register() {
  const { t, rich, locale } = useI18n(messages);
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
      setError(apiError(err, t('googleSignupFailed')));
    }
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // The language picks the confirmation email's language and link.
      finish(await axios.post(`${API_URL}/auth/register`, { ...form, locale }));
    } catch (err) {
      setError(apiError(err, t('registerFailed')));
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title={t('registerTitle')}
      seoTitle={t('registerSeo')}
      lede={t('registerLede')}
      footer={rich('haveAccount', { link: (text) => <Link to="/login" state={location.state} className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">{text}</Link> })}
    >
      <GoogleButton onCredential={onGoogle} text="signup_with" />
      <OrDivider />
      <form onSubmit={submit} className="space-y-4">
        <AuthError>{error}</AuthError>
        <AuthField label={t('fullName')}>
          <input value={form.name} onChange={set('name')} required autoComplete="name" className={authInput} />
        </AuthField>
        <AuthField label={t('email')}>
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" className={authInput} />
        </AuthField>
        <AuthField label={t('phoneOptional')} hint={t('phoneHint')}>
          <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" className={authInput} />
        </AuthField>
        <AuthField label={t('password')} hint={t('passwordHint')}>
          <input type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" className={authInput} />
        </AuthField>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? t('creating') : t('createAccount')}</Button>
      </form>
    </AuthShell>
  );
}
