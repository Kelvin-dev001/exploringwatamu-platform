import { CarFront, Users } from 'lucide-react';
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
import { translate } from '@/i18n';
import catalogText from '@/locales/catalog';
import { useI18n } from '@/i18n';
import { pickText } from '@/i18n/listingContent';
import messages from '@/locales/listings';
import whatsappText from '@/locales/whatsapp';

const ART_CYCLE = ['slow', 'ocean', 'romance', 'culture', 'adventure'];

export default function CarHire() {
  const { t, locale } = useI18n(messages);
  const tw = (key, vars) => translate(whatsappText, locale, key, vars);
  const tc = (key, vars) => translate(catalogText, locale, key, vars);
  const { items, loading, error, retry } = useListing('/carhire', LIST_PARAMS);
  return (
    <>
      <Seo route="/carhire" />
      <PageHero eyebrow={t('carsEyebrow')} title={t('carsTitle')} lede={t('carsLede')} />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what={t('whatCars')} onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState title={t('carsEmptyTitle')} text={t('carsEmptyText')}>
            <Button href={`mailto:hello@exploringwatamu.com?subject=${encodeURIComponent(t('carSubject'))}`}>{t('askTeam')}</Button>
            <WhatsAppButton message={generalMessage('car')}>{tw('ask')}</WhatsAppButton>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((c, i) => {
              const description = pickText(c, 'description', locale);
              return (
              <ListingCard
                key={c._id}
                images={c.vehicle?.image ? [c.vehicle.image] : []}
                art={ART_CYCLE[i % ART_CYCLE.length]}
                title={c.vehicle?.name || tc('vehicle')}
                meta={[c.vehicle?.capacity && { icon: Users, text: tc('seats', { count: Number(c.vehicle.capacity) }) }, c.vehicle?.type && { icon: CarFront, text: c.vehicle.type }]}
                description={description.text}
                descriptionLang={description.lang}
                price={c.dailyRate != null ? { amount: c.dailyRate, unit: 'per day' } : null}
                reviews={{ listingType: 'carhire', listingId: c._id, stats: c.reviewStats }}
                actions={
                  <>
                    <WhatsAppButton iconOnly className="size-9" message={listingEnquiry('carhire', c)} label={tw('askAbout', { name: c.vehicle?.name || t('thisCar') })} />
                    <AddToTripButton snapshot={snapshotFor('carhire', c)} label={t('addCar')} />
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
