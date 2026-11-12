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

export default function Login() {
  const { t, rich } = useI18n(messages);
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
      setError(apiError(err, t('googleFailed')));
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
      setError(apiError(err, t('loginFailed')));
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title={t('loginTitle')}
      seoTitle={t('loginSeo')}
      lede={t('loginLede')}
      footer={rich('newHere', { link: (text) => <Link to="/register" state={location.state} className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">{text}</Link> })}
    >
      <GoogleButton onCredential={onGoogle} />
      <OrDivider />
      <form onSubmit={submit} className="space-y-4">
        <AuthError>{error}</AuthError>
        <AuthField label={t('email')}>
          <input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" className={authInput} />
        </AuthField>
        <AuthField label={t('password')}>
          <input type="password" name="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" className={authInput} />
        </AuthField>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-lagoon-700 hover:underline">{t('forgot')}</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? t('signingIn') : t('signIn')}</Button>
      </form>
    </AuthShell>
  );
}
