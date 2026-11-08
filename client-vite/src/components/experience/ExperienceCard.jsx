import { Link } from 'react-router-dom';
import AddToTripButton from '@/components/trip/AddToTripButton';
import { Clock, Sparkles, Users, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { WaveField, Rosette, ArchBand, Weave, ChainBand } from '@/components/brand/Patterns';
import { VIBES, byId } from '@/lib/vibes';
import { priceFor, formatKES } from '@/lib/catalog';
import { cn } from '@/lib/utils';

/*
 * Illustrated stand-in used whenever a listing has no photo yet, keyed to its
 * first vibe so the grid still looks varied and on-brand.
 */
const ART = {
  ocean: { bg: 'bg-lagoon-600', fg: 'text-lagoon-300/60', motif: 'waves', sun: false },
  slow: { bg: 'bg-sand-200', fg: 'text-sand-400', motif: 'weave', sun: true },
  adventure: { bg: 'bg-ocean-800', fg: 'text-ocean-600', motif: 'rosette', sun: false },
  culture: { bg: 'bg-ochre-300', fg: 'text-ochre-700/50', motif: 'arches', sun: false },
  romance: { bg: 'bg-coral-400', fg: 'text-coral-200', motif: 'waves', sun: true },
  social: { bg: 'bg-ocean-700', fg: 'text-lagoon-400/60', motif: 'chain', sun: false },
};

export function VibeArt({ vibe, className, label }) {
  const a = ART[vibe] || ART.ocean;
  const Icon = byId(VIBES, vibe)?.icon;
  return (
    <div className={cn('relative overflow-hidden', a.bg, className)} role="img" aria-label={label || 'Illustration'}>
      {a.motif === 'waves' && <WaveField className={cn('absolute inset-x-0 bottom-0 h-1/2', a.fg)} rows={6} gap={14} />}
      {a.motif === 'weave' && <Weave className={cn('absolute inset-0', a.fg)} />}
      {a.motif === 'rosette' && <Rosette className={cn('absolute -bottom-10 -right-8', a.fg)} size={200} />}
      {a.motif === 'arches' && (
        <div className="absolute inset-x-0 bottom-0 space-y-1">
          <ArchBand className={a.fg} height={26} />
          <ArchBand className={a.fg} height={26} />
        </div>
      )}
      {a.motif === 'chain' && (
        <div className="absolute inset-x-0 top-1/2 space-y-2">
          <ChainBand className={a.fg} height={18} />
          <ChainBand className={a.fg} height={18} />
        </div>
      )}
      {a.sun && <div className="absolute left-1/2 top-[22%] size-16 -translate-x-1/2 rounded-full bg-coral-500/90" />}
      {Icon && (
        <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white/85 text-ocean-900 backdrop-blur">
          <Icon className="size-5" />
        </span>
      )}
    </div>
  );
}

function formatStart(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Product card for the store. `match` comes from scoreExperience().
 * Phase 3 adds "Add to my trip" next to the price.
 */
export default function ExperienceCard({ item, match, residency = 'nonResident', className }) {
  const vibe = byId(VIBES, item.vibes[0]);
  const price = priceFor(item, residency);

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white shadow-soft transition-all duration-300 ease-[var(--ease-tide)] hover:-translate-y-1 hover:shadow-lift',
        className
      )}
    >
      <div className="relative m-2.5 mb-0 aspect-[4/3] overflow-hidden rounded-[1rem]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-tide)] group-hover:scale-105"
          />
        ) : (
          <VibeArt vibe={item.vibes[0]} className="size-full" label={item.title} />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {match?.great && (
            <Badge tone="coral" className="shadow-soft">
              <Sparkles /> Great match
            </Badge>
          )}
          {item.kind === 'group' && (
            <Badge tone="glass">
              <Users /> Group trip
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ocean-900/60">
          {vibe && (
            <span className="inline-flex items-center gap-1">
              <vibe.icon className="size-4 text-coral-500" /> {vibe.label}
            </span>
          )}
          {item.kind === 'group' && item.startDate ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" /> {formatStart(item.startDate)}
              {item.lengthLabel ? ` · ${item.lengthLabel}` : ''}
            </span>
          ) : (
            item.lengthLabel && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" /> {item.lengthLabel}
              </span>
            )
          )}
        </div>

        <h3 className="mt-2 font-display text-[1.4rem] leading-tight text-ocean-900">
          {/* Stretched link: the whole card opens the experience, the button stays a real button */}
          <Link to={item.href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-[var(--radius-card)] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-coral-500">
            {item.title}
          </Link>
        </h3>
        {item.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ocean-900/60">{item.summary}</p>}

        {match?.great && match.reasons.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-lagoon-700">Matches: {match.reasons.join(' · ')}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="text-sm text-ocean-900/60">
            {price !== null && price !== undefined ? (
              <>
                from
                <span className="block whitespace-nowrap font-display text-2xl leading-tight text-ocean-900">{formatKES(price)}</span>
                <span className="text-xs">{item.price.unit}</span>
              </>
            ) : (
              <span className="font-semibold text-ocean-900">Price on request</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {item.kind === 'group' && item.full ? (
              <Badge tone="sand">Fully booked</Badge>
            ) : (
              <>
                {item.kind === 'group' && item.seatsLeft > 0 && item.seatsLeft <= 5 && <Badge tone="ochre">{item.seatsLeft} seats left</Badge>}
                <AddToTripButton item={item} />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
