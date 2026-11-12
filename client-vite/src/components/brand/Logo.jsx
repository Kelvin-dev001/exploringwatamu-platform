import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

/**
 * The ExploringWatamu badge (dhow, palms, sun, dolphins, turtle).
 * Cut to a transparent circle from client/assets/logo.png; served at three
 * sizes from /public/brand so phones never download the 512px version.
 */
export function BrandBadge({ className, alt = '', priority = false }) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet="/brand/logo-badge-96.webp 96w, /brand/logo-badge-192.webp 192w, /brand/logo-badge-512.webp 512w"
        sizes="(min-width: 1024px) 160px, 64px"
      />
      <img
        src="/brand/logo-badge-192.png"
        srcSet="/brand/logo-badge-96.png 96w, /brand/logo-badge-192.png 192w, /brand/logo-badge-512.png 512w"
        sizes="(min-width: 1024px) 160px, 64px"
        alt={alt}
        width="192"
        height="192"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('block size-11 rounded-full shadow-[0_2px_10px_-2px_rgb(11_38_66/0.35)]', className)}
      />
    </picture>
  );
}

/**
 * Badge + wordmark. `tone="light"` for dark backgrounds.
 * `badgeOnly` for tight spaces (the badge already reads "Exploring Watamu").
 */
export function Logo({ tone = 'dark', className, to = '/', badgeOnly = false }) {
  const light = tone === 'light';
  const { t } = useI18n();
  return (
    <Link
      to={to}
      aria-label={t('brandHome')}
      className={cn('group inline-flex items-center gap-3', light ? 'text-sand-50' : 'text-ocean-900', className)}
    >
      <BrandBadge priority className="transition-transform duration-500 ease-[var(--ease-tide)] group-hover:rotate-[-8deg]" />
      {!badgeOnly && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'text-[0.62rem] font-bold uppercase tracking-[0.32em]',
              light ? 'text-lagoon-300' : 'text-lagoon-600'
            )}
          >
            Exploring
          </span>
          <span className="-mt-0.5 font-display text-[1.45rem] font-semibold tracking-wide">Watamu</span>
        </span>
      )}
    </Link>
  );
}
