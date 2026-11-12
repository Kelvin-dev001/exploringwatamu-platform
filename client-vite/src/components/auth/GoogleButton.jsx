import { useEffect, useRef } from 'react';
import { useI18n } from '@/i18n';
import messages from '@/locales/account';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '728099992484-opn05vmlv2b4ddfenli3kcfqb1244l5v.apps.googleusercontent.com';
const SCRIPT_ID = 'google-gsi-script';

/** Google Identity Services button. `onCredential(credential)` receives the ID token. */
export default function GoogleButton({ onCredential, text = 'signin_with' }) {
  // Google draws the button itself: tell it the page's language.
  const { locale } = useI18n(messages);
  const ref = useRef(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: (r) => cb.current(r.credential) });
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', width: ref.current.offsetWidth || 380, text, locale });
    };
    if (window.google) render();
    else {
      let s = document.getElementById(SCRIPT_ID);
      if (!s) {
        s = document.createElement('script');
        s.id = SCRIPT_ID;
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        document.body.appendChild(s);
      }
      s.addEventListener('load', render);
    }
    return () => {
      cancelled = true;
    };
  }, [text, locale]);

  return <div ref={ref} className="min-h-11 w-full" />;
}

export function OrDivider() {
  const { t } = useI18n(messages);
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-ocean-900/55">
      <span className="h-px flex-1 bg-sand-300" /> {t('or')} <span className="h-px flex-1 bg-sand-300" />
    </div>
  );
}
