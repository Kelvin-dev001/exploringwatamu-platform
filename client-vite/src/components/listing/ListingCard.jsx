import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VibeArt } from '@/components/experience/ExperienceCard';
import { cn } from '@/lib/utils';
import Photo from '@/components/ui/Photo';
import { normaliseWhatsAppNumber, whatsappLink } from '@/lib/whatsapp';
import { RatingBadge } from '@/components/reviews/Rating';
import ReviewsSheet from '@/components/reviews/ReviewsSheet';
import { ratingOf } from '@/lib/reviews';
import { unitLabel } from '@/lib/catalog';
import { formatKES, useI18n } from '@/i18n';
import messages from '@/locales/listings';

/** Photo strip with arrows/dots, or the illustrated stand-in when there are no photos. */
export function CardMedia({ images = [], alt, art = 'ocean', className }) {
  const { t } = useI18n(messages);
  const pics = images.filter(Boolean);
  const [i, setI] = useState(0);
  const placeholder = <VibeArt vibe={art} className={cn('aspect-[4/3] w-full', className)} label={alt} />;
  if (!pics.length) return placeholder;
  const go = (d) => (e) => {
    e.preventDefault();
    setI((n) => (n + d + pics.length) % pics.length);
  };
  return (
    <div className={cn('group/media relative aspect-[4/3] w-full overflow-hidden bg-sand-100', className)}>
      <Photo
        src={pics[i]}
        alt={pics.length > 1 ? t('photoOf', { title: alt, n: i + 1, total: pics.length }) : alt}
        sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
        max={960}
        className="size-full object-cover"
        fallback={placeholder}
      />
      {pics.length > 1 && (
        <>
          <button type="button" onClick={go(-1)} aria-label={t('prevPhoto')} className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ocean-900 opacity-0 shadow-soft transition group-hover/media:opacity-100 focus-visible:opacity-100">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={go(1)} aria-label={t('nextPhoto')} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ocean-900 opacity-0 shadow-soft transition group-hover/media:opacity-100 focus-visible:opacity-100">
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
 * reviews: { listingType, listingId, stats } — shows the rating, which opens the reviews.
 * titleLang / descriptionLang / chipsLang: the language of the listing's own
 * text when it isn't the page's (English text on an Italian page).
 * price.unit: an English unit ("per night"), shown in the page's language.
 */
export default function ListingCard({ images, art, title, titleLang, badge, meta = [], description, descriptionLang, chips = [], chipsLang, price, actions, reviews, children }) {
  const { t, langOf } = useI18n(messages);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const rated = reviews && ratingOf(reviews.stats);
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
        <h3 lang={langOf(titleLang)} className="mt-2 font-display text-[1.4rem] leading-tight text-ocean-900">
          {title}
        </h3>
        {rated && <RatingBadge stats={reviews.stats} onClick={() => setReviewsOpen(true)} className="mt-1.5 self-start" />}
        {description && (
          <p lang={langOf(descriptionLang)} className="mt-2 line-clamp-3 text-sm leading-relaxed text-ocean-900/60">
            {description}
          </p>
        )}
        {chips.length > 0 && (
          <ul lang={langOf(chipsLang)} className="mt-3 flex flex-wrap gap-1.5">
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
                {price.prefix ?? t('from')}
                <span className="block whitespace-nowrap font-display text-2xl leading-tight text-ocean-900">{formatKES(price.amount)}</span>
                {price.unit && <span className="text-xs">{unitLabel(price.unit)}</span>}
              </>
            ) : (
              <span className="font-semibold text-ocean-900">{t('priceOnRequest')}</span>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
        </div>
      </div>
      {rated && <ReviewsSheet open={reviewsOpen} onOpenChange={setReviewsOpen} listingType={reviews.listingType} listingId={reviews.listingId} title={title} />}
    </article>
  );
}

/**
 * WhatsApp / email contact buttons for listings that have them. The host's
 * number goes through the same check as ours (a local "0712 …" used to make a
 * broken wa.me/0712… link); a number that can't be used is left out.
 */
export function ContactLinks({ whatsapp, email, subject }) {
  const { t } = useI18n(messages);
  const wa = whatsapp && (whatsapp.startsWith('http') ? whatsapp : whatsappLink(normaliseWhatsAppNumber(whatsapp)));
  if (!wa && !email) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-sm">
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1.5 font-semibold text-ocean-900 hover:border-ocean-900/40">
          {t('whatsappHost')}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`} className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1.5 font-semibold text-ocean-900 hover:border-ocean-900/40">
          {t('email')}
        </a>
      )}
    </div>
  );
}
