import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LOCALE_META, followAddress, useLocale } from '@/i18n';

/**
 * The router for the current language. Italian pages live under /it, which
 * is the router's basename there, so every existing <Link to="/trip"> or
 * navigate('/my-trips') already lands on /it/trip or /it/my-trips — moving
 * around never drops the language.
 *
 * Switching language starts a fresh router at the new address (the key), and
 * Back/Forward across a language switch follow the address.
 */
export default function LocaleRouter({ children }) {
  const locale = useLocale();
  useEffect(() => {
    const onPop = () => followAddress();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return (
    <BrowserRouter key={locale} basename={LOCALE_META[locale].prefix || undefined}>
      {children}
    </BrowserRouter>
  );
}
