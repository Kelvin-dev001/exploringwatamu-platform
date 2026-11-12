import { CalendarDays, Clock } from 'lucide-react';
import useListing, { LIST_PARAMS } from '@/components/listing/useListing';
import PageHero from '@/components/listing/PageHero';
import ListingCard from '@/components/listing/ListingCard';
import { GridSkeleton, ErrorState, EmptyState } from '@/components/listing/States';
import AddToTripButton from '@/components/trip/AddToTripButton';
import Seo from '@/components/seo/Seo';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { snapshotFor } from '@/lib/trip';
import { listingEnquiry, generalMessage } from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/contact/WhatsApp';
import { translate, weekdayName } from '@/i18n';
import { useI18n } from '@/i18n';
import { pickText } from '@/i18n/listingContent';
import messages from '@/locales/listings';
import whatsappText from '@/locales/whatsapp';

const ART_CYCLE = ['slow', 'ocean', 'romance', 'culture', 'adventure'];

export default function Services() {
  const { t, locale } = useI18n(messages);
  const tw = (key, vars) => translate(whatsappText, locale, key, vars);
  const { items, loading, error, retry } = useListing('/services', LIST_PARAMS);
  return (
    <>
      <Seo route="/services" />
      <PageHero eyebrow={t('servicesEyebrow')} title={t('servicesTitle')} lede={t('servicesLede')} />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what={t('whatServices')} onRetry={retry} />
        ) : loading ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <EmptyState title={t('servicesEmptyTitle')} text={t('servicesEmptyText')}>
            <Button href={`mailto:hello@exploringwatamu.com?subject=${encodeURIComponent(t('serviceSubject'))}`}>{t('askTeam')}</Button>
            <WhatsAppButton message={generalMessage('service')}>{tw('ask')}</WhatsAppButton>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((s, i) => {
              const title = pickText(s, 'title', locale, s.name);
              const description = pickText(s, 'description', locale);
              return (
              <ListingCard
                key={s._id}
                images={s.gallery}
                art={ART_CYCLE[i % ART_CYCLE.length]}
                title={title.text}
                titleLang={title.lang}
                meta={[
                  s.availableDays?.length && { icon: CalendarDays, text: s.availableDays.length === 7 ? t('everyDay') : s.availableDays.map((d) => weekdayName(d, locale)).join(', ') },
                  (s.availableHours?.start || s.availableHours?.end) && { icon: Clock, text: `${s.availableHours.start || ''}–${s.availableHours.end || ''}` },
                ]}
                description={description.text}
                descriptionLang={description.lang}
                price={s.price != null ? { amount: s.price, unit: s.pricingType || '' } : null}
                reviews={{ listingType: 'service', listingId: s._id, stats: s.reviewStats }}
                actions={
                  <>
                    <WhatsAppButton iconOnly className="size-9" message={listingEnquiry('service', s)} label={tw('askAbout', { name: title.text })} />
                    <AddToTripButton snapshot={snapshotFor('service', s)} label={t('addService')} />
                  </>
                }
              />
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
