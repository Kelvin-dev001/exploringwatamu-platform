import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import messages from '@/locales/listings';

/**
 * Shown while something is still loading after a few seconds — usually the
 * free-tier API waking up — so the page reads as "on its way", not broken.
 */
export function SlowNotice({ delay = 6000, className }) {
  const { t } = useI18n(messages);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return (
    <p role="status" className={cn('mx-auto max-w-md rounded-2xl bg-lagoon-50 px-4 py-3 text-center text-sm text-lagoon-700', className)}>
      {t('slow')}
    </p>
  );
}

export function GridSkeleton({ count = 6 }) {
  const { t } = useI18n(messages);
  return (
    <div role="status" aria-label={t('loading')}>
      <SlowNotice className="mb-6" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white p-2.5">
            <div className="aspect-[4/3] animate-pulse rounded-[1rem] bg-sand-100" />
            <div className="space-y-3 p-3">
              <div className="h-3 w-1/3 animate-pulse rounded bg-sand-100" />
              <div className="h-6 w-4/5 animate-pulse rounded bg-sand-100" />
              <div className="h-3 w-full animate-pulse rounded bg-sand-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "We couldn’t load {what}" — pass `what` in the page's language ("this experience" / "questa esperienza"). */
export function ErrorState({ what, onRetry }) {
  const { t } = useI18n(messages);
  return (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-10 text-center">
      <p className="font-display text-2xl text-ocean-900">{t('loadError', { what: what || t('thisPage') })}</p>
      <p className="mt-2 text-ocean-900/60">{t('checkConnection')}</p>
      {onRetry && (
        <Button className="mt-6" onClick={onRetry}>
          {t('tryAgain')}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, children }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-sand-100/60 p-10 text-center">
      <p className="font-display text-2xl text-ocean-900">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-ocean-900/60">{text}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
