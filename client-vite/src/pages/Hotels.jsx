import { useMemo, useState } from 'react';
import { MapPin, Star, ExternalLink } from 'lucide-react';
import useListing from '@/components/listing/useListing';
import PageHero from '@/components/listing/PageHero';
import ListingCard, { ContactLinks } from '@/components/listing/ListingCard';
import { GridSkeleton, ErrorState, EmptyState } from '@/components/listing/States';
import AddToTripButton from '@/components/trip/AddToTripButton';
import Seo from '@/components/seo/Seo';
import { Container, Chip, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { snapshotFor } from '@/lib/trip';
import { listingEnquiry, generalMessage } from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/contact/WhatsApp';
import { translate } from '@/i18n';
import catalogText from '@/locales/catalog';
import { useI18n } from '@/i18n';
import { pickText } from '@/i18n/listingContent';
import messages from '@/locales/listings';
import whatsappText from '@/locales/whatsapp';

const ART_CYCLE = ['slow', 'ocean', 'romance', 'culture', 'adventure'];

// Labels are message keys (locales/listings.js).
const TYPES = [
  { id: '', label: 'allStays' },
  { id: 'hotel', label: 'hotels' },
  { id: 'airbnb', label: 'airbnbs' },
  { id: 'villa', label: 'villas' },
];
const RATINGS = [
  { id: 0, label: 'anyRating' },
  { id: 3, label: 'starsUp' },
  { id: 4, label: 'starsUp' },
  { id: 5, label: 'fiveStars' },
];
const STAY_TYPE = { hotel: 'stayHotel', villa: 'stayVilla', airbnb: 'stayAirbnb' };

const locationText = (l) => (!l ? null : typeof l === 'string' ? l : l.address || null);

export default function Hotels() {
  const { t, locale, formatKES } = useI18n(messages);
  const tw = (key, vars) => translate(whatsappText, locale, key, vars);
  const tc = (key, vars) => translate(catalogText, locale, key, vars);
  const { items, loading, error, retry } = useListing('/hotels');
  const [type, setType] = useState('');
  const [minStars, setMinStars] = useState(0);

  const filtered = useMemo(
    () => items.filter((a) => (!type || a.type === type) && (!minStars || (a.stars || 0) >= minStars)),
    [items, type, minStars]
  );

  return (
    <>
      <Seo route="/hotels" />
      <PageHero eyebrow={t('staysEyebrow')} title={t('staysTitle')} lede={t('staysLede')} />

      <Container size="wide" className="py-10 lg:py-14">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('typeOfStay')}>
            {TYPES.map((option) => (
              <Chip key={option.id || 'all'} selected={type === option.id} onClick={() => setType(option.id)}>
                {t(option.label)}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('starRating')}>
            {RATINGS.map((r) => (
              <Chip key={r.id} selected={minStars === r.id} onClick={() => setMinStars(r.id)}>
                {t(r.label, { n: r.id })}
              </Chip>
            ))}
          </div>
        </div>

        {error ? (
          <ErrorState what={t('whatStays')} onRetry={retry} />
        ) : loading ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title={t('staysEmptyTitle')} text={t('staysEmptyText')}>
            <Button variant="outline" onClick={() => { setType(''); setMinStars(0); }}>{t('showAllStays')}</Button>
            <Button href={`mailto:hello@exploringwatamu.com?subject=${encodeURIComponent(t('staySubject'))}`}>{t('askTeam')}</Button>
            <WhatsAppButton message={generalMessage('stay')}>{tw('ask')}</WhatsAppButton>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a, i) => {
              const loc = locationText(a.location);
              const whatsapp = a.whatsapp || a.contact?.whatsapp;
              const email = a.email || a.contact?.email;
              const description = pickText(a, 'description', locale);
              return (
                <ListingCard
                  key={a._id}
                  images={a.images}
                  art={ART_CYCLE[i % ART_CYCLE.length]}
                  title={a.name}
                  badge={a.type ? <Badge tone="glass" className="capitalize">{STAY_TYPE[a.type] ? tc(STAY_TYPE[a.type]) : a.type}</Badge> : null}
                  meta={[
                    a.stars > 0 && { icon: Star, text: tc('stars', { n: a.stars }) },
                    loc && { icon: MapPin, text: loc },
                  ]}
                  description={description.text}
                  descriptionLang={description.lang}
                  chips={a.facilities || []}
                  chipsLang="en"
                  price={a.pricePerNight != null ? { amount: a.pricePerNight, unit: 'per night' } : null}
                  reviews={{ listingType: 'stay', listingId: a._id, stats: a.reviewStats }}
                  actions={
                    <>
                      <WhatsAppButton iconOnly className="size-9" message={listingEnquiry('stay', a)} label={tw('askAbout', { name: a.name })} />
                      <AddToTripButton snapshot={snapshotFor('stay', a)} label={t('addStay')} />
                    </>
                  }
                >
                  {a.roomTypes?.length > 0 && (
                    <p className="mt-3 text-xs text-ocean-900/60">
                      {t('rooms', { list: a.roomTypes.slice(0, 3).map((r) => r.name + (r.price ? ` (${formatKES(r.price)})` : '')).join(' · ') })}
                    </p>
                  )}
                  {a.location?.mapUrl && (
                    <a href={a.location.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-lagoon-700 hover:underline">
                      {t('viewMap')} <ExternalLink className="size-3" />
                    </a>
                  )}
                  <ContactLinks whatsapp={whatsapp} email={email} subject={t('enquiry', { name: a.name })} />
                </ListingCard>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
