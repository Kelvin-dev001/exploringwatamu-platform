import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MailCheck } from 'lucide-react';
import { API_URL } from '@/api.js';
import AuthShell, { AuthField, AuthError, authInput } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import messages from '@/locales/account';
import { apiError } from '@/lib/apiErrors';

export default function ForgotPassword() {
  const { t, rich, locale } = useI18n(messages);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // The language goes along so the reset email (and its link) is in it.
      await axios.post(`${API_URL}/auth/forgot-password`, { email, locale });
      setSent(true);
    } catch (err) {
      setError(apiError(err, t('genericError')));
    }
    setLoading(false);
  };

  return (
    <AuthShell title={t('forgotTitle')} lede={t('forgotLede')} footer={<Link to="/login" className="font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4">{t('backToSignIn')}</Link>}>
      {sent ? (
        <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 text-center shadow-soft" role="status">
          <MailCheck className="mx-auto size-10 text-lagoon-600" />
          <p className="mt-3 text-ocean-900/75">{rich('forgotSent', { b: (text) => <strong className="text-ocean-900">{text}</strong> }, { email })}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthError>{error}</AuthError>
          <AuthField label={t('email')}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={authInput} />
          </AuthField>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? t('sending') : t('sendLink')}</Button>
        </form>
      )}
    </AuthShell>
  );
}
