import { CarFront, Users, Plane } from 'lucide-react';
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

export default function Transfers() {
  const { t, locale } = useI18n(messages);
  const tw = (key, vars) => translate(whatsappText, locale, key, vars);
  const tc = (key, vars) => translate(catalogText, locale, key, vars);
  const { items, loading, error, retry } = useListing('/transfers', LIST_PARAMS);
  return (
    <>
      <Seo route="/transfers" />
      <PageHero eyebrow={t('transfersEyebrow')} title={t('transfersTitle')} lede={t('transfersLede')} />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what={t('whatTransfers')} onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState title={t('transfersEmptyTitle')} text={t('transfersEmptyText')}>
            <Button to="/trip">{t('addPickup')}</Button>
            <WhatsAppButton message={generalMessage('transfer')}>{tw('ask')}</WhatsAppButton>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((x, i) => {
              const description = pickText(x, 'description', locale);
              return (
              <ListingCard
                key={x._id}
                images={x.vehicle?.image ? [x.vehicle.image] : []}
                art={ART_CYCLE[i % ART_CYCLE.length]}
                title={x.route}
                meta={[x.vehicle?.name && { icon: CarFront, text: x.vehicle.name }, x.vehicle?.capacity && { icon: Users, text: tc('seats', { count: Number(x.vehicle.capacity) }) }, { icon: Plane, text: t('privateTransfer') }]}
                description={description.text}
                descriptionLang={description.lang}
                price={x.price != null ? { amount: x.price, unit: 'per vehicle', prefix: '' } : null}
                reviews={{ listingType: 'transfer', listingId: x._id, stats: x.reviewStats }}
                actions={
                  <>
                    <WhatsAppButton iconOnly className="size-9" message={listingEnquiry('transfer', x)} label={tw('askAbout', { name: x.route || t('thisTransfer') })} />
                    <AddToTripButton snapshot={snapshotFor('transfer', x)} label={t('addTransfer')} />
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
