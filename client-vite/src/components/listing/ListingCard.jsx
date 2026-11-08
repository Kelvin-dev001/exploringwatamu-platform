import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VibeArt } from '@/components/experience/ExperienceCard';
import { cn } from '@/lib/utils';

/** Photo strip with arrows/dots, or the illustrated stand-in when there are no photos. */
export function CardMedia({ images = [], alt, art = 'ocean', className }) {
  const pics = images.filter(Boolean);
  const [i, setI] = useState(0);
  if (!pics.length) return <VibeArt vibe={art} className={cn('aspect-[4/3] w-full', className)} label={alt} />;
  const go = (d) => (e) => {
    e.preventDefault();
    setI((n) => (n + d + pics.length) % pics.length);
  };
  return (
    <div className={cn('group/media relative aspect-[4/3] w-full overflow-hidden bg-sand-100', className)}>
      <img src={pics[i]} alt={`${alt}${pics.length > 1 ? ` — photo ${i + 1} of ${pics.length}` : ''}`} loading="lazy" decoding="async" className="size-full object-cover" />
      {pics.length > 1 && (
        <>
          <button type="button" onClick={go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ocean-900 opacity-0 shadow-soft transition group-hover/media:opacity-100 focus-visible:opacity-100">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ocean-900 opacity-0 shadow-soft transition group-hover/media:opacity-100 focus-visible:opacity-100">
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden="true">
            {pics.map((_, n) => (
              <span key={n} className={cn('size-1.5 rounded-full', n === i ? 'bg-white' : 'bg-white/50')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Card for stays, transfers, car hire, services and property.
 * meta: [{ icon, text }] · chips: [string] · price: { amount, unit, prefix }
 */
export default function ListingCard({ images, art, title, badge, meta = [], description, chips = [], price, actions, children }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white shadow-soft transition-shadow duration-300 hover:shadow-lift">
      <div className="relative m-2.5 mb-0 overflow-hidden rounded-[1rem]">
        <CardMedia images={images} alt={title} art={art} />
        {badge && <div className="absolute left-3 top-3">{badge}</div>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ocean-900/60">
            {meta.filter((m) => m && m.text).map((m, n) => (
              <span key={n} className="inline-flex items-center gap-1">
                {m.icon && <m.icon className="size-4 text-lagoon-600" />} {m.text}
              </span>
            ))}
          </div>
        )}
        <h3 className="mt-2 font-display text-[1.4rem] leading-tight text-ocean-900">{title}</h3>
        {description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ocean-900/60">{description}</p>}
        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {chips.slice(0, 5).map((c) => (
              <li key={c} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ocean-900/70">{c}</li>
            ))}
            {chips.length > 5 && <li className="rounded-full bg-sand-100 px-2.5 py-1 text-xs text-ocean-900/60">+{chips.length - 5}</li>}
          </ul>
        )}
        {children}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
          <div className="text-sm text-ocean-900/60">
            {price?.amount != null ? (
              <>
                {price.prefix ?? 'from'}
                <span className="block whitespace-nowrap font-display text-2xl leading-tight text-ocean-900">KES {Math.round(price.amount).toLocaleString('en-KE')}</span>
                {price.unit && <span className="text-xs">{price.unit}</span>}
              </>
            ) : (
              <span className="font-semibold text-ocean-900">Price on request</span>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
        </div>
      </div>
    </article>
  );
}

/** WhatsApp / email contact buttons for listings that have them. */
export function ContactLinks({ whatsapp, email, subject }) {
  if (!whatsapp && !email) return null;
  const wa = whatsapp && (whatsapp.startsWith('http') ? whatsapp : `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`);
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-sm">
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1.5 font-semibold text-ocean-900 hover:border-ocean-900/40">
          WhatsApp the host
        </a>
      )}
      {email && (
        <a href={`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`} className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1.5 font-semibold text-ocean-900 hover:border-ocean-900/40">
          Email
        </a>
      )}
    </div>
  );
}
