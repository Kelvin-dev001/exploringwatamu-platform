import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/api.js';
import AuthShell, { AuthField, AuthError, authInput } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import messages from '@/locales/account';
import { apiError } from '@/lib/apiErrors';

export default function ResetPassword() {
  const { t, rich } = useI18n(messages);
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError(t('passwordShort'));
    if (password !== confirm) return setError(t('passwordMismatch'));
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(apiError(err, t('resetFailed')));
    }
    setLoading(false);
  };

  return (
    <AuthShell title={t('resetTitle')} footer={<Link to="/login" className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">{t('backToSignIn')}</Link>}>
      {!token ? (
        <AuthError>
          {rich('resetInvalid', { link: (text) => <Link to="/forgot-password" className="underline">{text}</Link> })}
        </AuthError>
      ) : done ? (
        <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 text-center shadow-soft" role="status">
          <CheckCircle2 className="mx-auto size-10 text-mangrove-500" />
          <p className="mt-3 text-ocean-900/75">{t('resetDone')}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthError>{error}</AuthError>
          <AuthField label={t('newPassword')} hint={t('passwordHint')}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={authInput} />
          </AuthField>
          <AuthField label={t('confirmPassword')}>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className={authInput} />
          </AuthField>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? t('saving') : t('savePassword')}</Button>
        </form>
      )}
    </AuthShell>
  );
}
