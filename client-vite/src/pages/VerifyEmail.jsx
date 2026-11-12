import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthShell, { AuthError } from '@/components/auth/AuthShell';
import { ResendConfirmation } from '@/components/auth/ConfirmEmailNotice';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import messages from '@/locales/account';

const linkClass = 'font-semibold text-ocean-900 underline decoration-coral-400 underline-offset-4';

/**
 * The link in the "confirm your email" message. Works signed in or not (the
 * token is the proof); each link works once, so it is sent once even when
 * React runs effects twice.
 */
export default function VerifyEmail() {
  const { t, rich } = useI18n(messages);
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { user, setUser } = useAuth();
  const [state, setState] = useState(token ? 'verifying' : 'failed'); // verifying | done | failed | offline
  const [email, setEmail] = useState('');
  const sent = useRef('');

  useEffect(() => {
    if (!token || sent.current === token) return;
    sent.current = token;
    axios
      .post(`${API_URL}/auth/verify-email`, { token })
      .then((res) => {
        setEmail(res.data?.email || '');
        setState('done');
      })
      .catch((err) => setState(err?.response ? 'failed' : 'offline'));
  }, [token]);

  // Signed in as the account just confirmed: the rest of the site knows at once.
  useEffect(() => {
    if (state === 'done' && user && user.emailVerified === false && user.email === email) setUser({ ...user, emailVerified: true });
  }, [state, email, user, setUser]);

  const footer = <Link to={user ? '/my-trips' : '/login'} className={linkClass}>{user ? t('title') : t('backToSignIn')}</Link>;

  if (state === 'verifying') {
    return (
      <AuthShell title={t('verifyTitle')} seoTitle={t('verifyTitle')}>
        <div className="flex items-center gap-3 text-ocean-900/70" role="status">
          <span className="size-6 animate-spin rounded-full border-2 border-sand-300 border-t-coral-500" />
          {t('verifying')}
        </div>
      </AuthShell>
    );
  }

  if (state === 'done') {
    return (
      <AuthShell title={t('verifyDoneTitle')} seoTitle={t('verifyTitle')}>
        <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 text-center shadow-soft" role="status">
          <CheckCircle2 className="mx-auto size-10 text-mangrove-500" />
          <p className="mt-3 text-ocean-900/75">{rich('verifyDone', { b: (text) => <strong>{text}</strong> }, { email })}</p>
          <Button to={user ? '/my-trips' : '/login'} state={user ? undefined : { from: '/my-trips' }} className="mt-5">
            {user ? t('verifySeeBookings') : t('signIn')}
          </Button>
        </div>
      </AuthShell>
    );
  }

  // The link didn't work. Already confirmed (e.g. clicked twice) is fine;
  // otherwise offer a new link — signed in, or after signing in.
  const alreadyConfirmed = user?.emailVerified === true;
  return (
    <AuthShell title={alreadyConfirmed ? t('verifyDoneTitle') : t('verifyTitle')} seoTitle={t('verifyTitle')} footer={footer}>
      {alreadyConfirmed ? (
        <p className="text-ocean-900/75" role="status">{rich('verifyAlready', { b: (text) => <strong>{text}</strong> }, { email: user.email })}</p>
      ) : state === 'offline' ? (
        <AuthError>{t('verifyOffline')}</AuthError>
      ) : (
        <>
          <AuthError>{t('verifyInvalid')}</AuthError>
          {user?.emailVerified === false ? (
            <ResendConfirmation className="mt-5" />
          ) : (
            !user && (
              <p className="mt-5 text-sm text-ocean-900/70">
                {rich('verifySignInForNew', { link: (text) => <Link to="/login" state={{ from: '/my-trips' }} className={linkClass}>{text}</Link> })}
              </p>
            )
          )}
        </>
      )}
    </AuthShell>
  );
}
