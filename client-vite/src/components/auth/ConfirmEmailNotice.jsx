import { useState } from 'react';
import axios from 'axios';
import { MailCheck } from 'lucide-react';
import { API_URL } from '@/api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import messages from '@/locales/account';

const SUPPORT_EMAIL = 'hello@exploringwatamu.com';

/**
 * "Send me a new confirmation link" for a signed-in account whose address
 * isn't confirmed yet. Says what happened: sent, email unavailable, too many
 * tries, or a failure. An address confirmed elsewhere (another tab) just
 * updates the account.
 */
export function ResendConfirmation({ className = '' }) {
  const { t, rich, locale } = useI18n(messages);
  const { user, setUser, token } = useAuth();
  const [state, setState] = useState('idle'); // idle | sending | sent | noEmail | limited | failed

  const send = async () => {
    setState('sending');
    try {
      const res = await axios.post(`${API_URL}/auth/resend-verification`, { locale }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.alreadyVerified) {
        setUser({ ...user, emailVerified: true });
        return;
      }
      setState(res.data?.delivery?.email === false ? 'noEmail' : 'sent');
    } catch (err) {
      setState(err?.response?.status === 429 ? 'limited' : 'failed');
    }
  };

  const mail = (text) => (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">
      {text}
    </a>
  );

  return (
    <div className={className}>
      {state === 'sent' ? (
        <p role="status" className="text-sm font-semibold text-mangrove-700">{t('confirmSent', { email: user?.email })}</p>
      ) : (
        <>
          <Button size="sm" variant="outline" onClick={send} disabled={state === 'sending'}>
            {state === 'sending' ? t('sending') : t('confirmResend')}
          </Button>
          {state === 'noEmail' && <p role="alert" className="mt-2 text-sm text-coral-700">{rich('confirmNoEmail', { mail })}</p>}
          {state === 'limited' && <p role="alert" className="mt-2 text-sm text-coral-700">{t('confirmLimited')}</p>}
          {state === 'failed' && <p role="alert" className="mt-2 text-sm text-coral-700">{t('confirmResendFailed')}</p>}
        </>
      )}
    </div>
  );
}

/** My bookings: why guest requests may be missing, and how to fix it. */
export default function ConfirmEmailNotice() {
  const { t, rich } = useI18n(messages);
  const { user } = useAuth();
  // Only when the API says so (older API versions don't send the flag).
  if (user?.emailVerified !== false) return null;
  return (
    <section aria-labelledby="confirm-email" className="mt-8 flex gap-4 rounded-[var(--radius-card)] border border-ochre-300 bg-ochre-100/60 p-5">
      <MailCheck className="mt-0.5 size-6 shrink-0 text-ochre-700" aria-hidden="true" />
      <div>
        <h2 id="confirm-email" className="font-semibold text-ocean-900">{t('confirmTitle')}</h2>
        <p className="mt-1 text-sm text-ocean-900/75">{rich('confirmText', { b: (text) => <strong>{text}</strong> }, { email: user.email })}</p>
        <ResendConfirmation className="mt-3" />
      </div>
    </section>
  );
}
