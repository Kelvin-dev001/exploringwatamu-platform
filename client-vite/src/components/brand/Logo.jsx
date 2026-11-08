import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Sun rising over three tide lines. Original mark, drawn in currentColor + coral. */
export function SunMark({ className }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn('size-9', className)}>
      <circle cx="20" cy="17" r="8.5" className="fill-coral-500" />
      <rect x="0" y="17" width="40" height="23" className="fill-[var(--logo-bg,var(--color-sand-50))]" />
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M6 21 Q 13 17.5 20 21 T 34 21" />
        <path d="M9 27 Q 14.5 24 20 27 T 31 27" />
        <path d="M13 33 Q 16.5 31 20 33 T 27 33" />
      </g>
    </svg>
  );
}

/**
 * Wordmark. `tone="light"` for dark backgrounds (sets the mark's cut-out
 * colour through --logo-bg so the sun still sits on the horizon).
 */
export function Logo({ tone = 'dark', className, to = '/' }) {
  const light = tone === 'light';
  return (
    <Link
      to={to}
      aria-label="Exploring Watamu — home"
      className={cn('group inline-flex items-center gap-2.5', light ? 'text-sand-50' : 'text-ocean-900', className)}
      style={{ '--logo-bg': light ? 'var(--color-ocean-900)' : 'var(--color-sand-50)' }}
    >
      <SunMark className="transition-transform duration-500 group-hover:-translate-y-0.5" />
      <span className="flex flex-col leading-none">
        <span className={cn('text-[0.62rem] font-bold uppercase tracking-[0.32em]', light ? 'text-sand-50/70' : 'text-ocean-900/60')}>
          Exploring
        </span>
        <span className="font-display text-[1.45rem] italic font-medium -mt-0.5">Watamu</span>
      </span>
    </Link>
  );
}
