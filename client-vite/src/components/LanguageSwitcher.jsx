import { useLocation } from 'react-router-dom';
import { LOCALES, LOCALE_META, localisePath, switchLocale, useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * EN | IT in the header ("English | Italiano" with `full`, in the menu).
 *
 * Each option is a real link to this same page in that language, so it can
 * be opened in a new tab and tells crawlers the other version exists; a plain
 * click switches in place (and is remembered). The current language is
 * filled in and marked aria-current for screen readers.
 */
export default function LanguageSwitcher({ full = false, tone = 'light', className }) {
  const { locale, t } = useI18n();
  const { pathname, search, hash } = useLocation();
  return (
    <div
      role="group"
      aria-label={t('language')}
      className={cn('inline-flex items-center rounded-full border p-0.5 text-sm font-semibold', tone === 'light' ? 'border-sand-300 bg-white' : 'border-sand-50/20 bg-ocean-800', className)}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <a
            key={l}
            href={localisePath(pathname, l) + search + hash}
            hrefLang={l}
            lang={l}
            aria-current={active ? 'true' : undefined}
            aria-label={full ? undefined : LOCALE_META[l].label}
            title={full || active ? undefined : t('languageSwitchTo', { language: LOCALE_META[l].label })}
            onClick={(e) => {
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab/window: let the link work
              e.preventDefault();
              switchLocale(l);
            }}
            className={cn(
              'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 transition',
              full && 'px-4',
              active
                ? tone === 'light'
                  ? 'bg-ocean-900 text-sand-50'
                  : 'bg-sand-50 text-ocean-900'
                : tone === 'light'
                  ? 'text-ocean-900/65 hover:text-ocean-900'
                  : 'text-sand-50/70 hover:text-sand-50'
            )}
          >
            {full ? LOCALE_META[l].label : LOCALE_META[l].short}
          </a>
        );
      })}
    </div>
  );
}
