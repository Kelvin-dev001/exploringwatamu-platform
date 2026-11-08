import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/** Page-width wrapper. `size="wide"` for editorial spreads, `"narrow"` for reading. */
export function Container({ size = 'default', className, children, ...props }) {
  const widths = { narrow: 'max-w-3xl', default: 'max-w-7xl', wide: 'max-w-[90rem]' };
  return (
    <div className={cn('mx-auto w-full px-5 sm:px-8 lg:px-12', widths[size], className)} {...props}>
      {children}
    </div>
  );
}

/** Eyebrow + serif heading + optional lede. The editorial building block. */
export function SectionHeading({ eyebrow, title, lede, align = 'left', className, as: Tag = 'h2' }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <Tag className="font-display text-3xl leading-[1.08] text-ocean-900 sm:text-4xl lg:text-[2.75rem]">
        {title}
      </Tag>
      {lede && <p className="mt-4 text-lg leading-relaxed text-ocean-900/70">{lede}</p>}
    </div>
  );
}

/** Static label: category, duration, "Great match". */
export function Badge({ tone = 'sand', className, children }) {
  const tones = {
    sand: 'bg-sand-200 text-ocean-900',
    ocean: 'bg-ocean-900 text-sand-50',
    coral: 'bg-coral-100 text-coral-700',
    mangrove: 'bg-mangrove-100 text-mangrove-700',
    ochre: 'bg-ochre-100 text-ochre-700',
    glass: 'bg-white/80 text-ocean-900 backdrop-blur',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold [&_svg]:size-3.5',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Toggleable chip used for vibes, companions and filters. */
export function Chip({ selected = false, icon: Icon, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200',
        selected
          ? 'border-ocean-900 bg-ocean-900 text-sand-50 shadow-soft'
          : 'border-ocean-900/15 bg-white/70 text-ocean-900 hover:border-ocean-900/40 hover:bg-white',
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn('size-4', selected ? 'text-coral-300' : 'text-coral-500')} />}
      {children}
      {selected && <Check className="size-3.5 text-sand-50/80" />}
    </button>
  );
}

/** Surface for listings and content blocks. `interactive` adds the lift on hover. */
export function Card({ interactive = false, className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white shadow-soft',
        interactive && 'transition-all duration-300 ease-[var(--ease-tide)] hover:-translate-y-1 hover:shadow-lift',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
