import { CalendarDays, Clock } from 'lucide-react';
import useListing from '@/components/listing/useListing';
import PageHero from '@/components/listing/PageHero';
import ListingCard from '@/components/listing/ListingCard';
import { GridSkeleton, ErrorState, EmptyState } from '@/components/listing/States';
import AddToTripButton from '@/components/trip/AddToTripButton';
import Seo from '@/components/seo/Seo';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { snapshotFor } from '@/lib/trip';

const ART_CYCLE = ['slow', 'ocean', 'romance', 'culture', 'adventure'];

export default function Services() {
  const { items, loading, error, retry } = useListing('/services');
  return (
    <>
      <Seo title="Local services in Watamu" description="Private chefs, guides, massage and more from trusted locals in Watamu. Add them to your trip and get one quote." />
      <PageHero eyebrow="Local services" title="The little extras" lede="Private chefs, guides, massages and more — from people we know and trust in Watamu." />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what="services" onRetry={retry} />
        ) : loading ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <EmptyState title="Services are arranged on request" text="Need a chef, a guide or a massage? Tell us and we’ll add it to your quote.">
            <Button href="mailto:hello@exploringwatamu.com?subject=Service%20request">Ask our team</Button>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((s, i) => (
              <ListingCard
                key={s._id}
                images={s.gallery}
                art={ART_CYCLE[i % ART_CYCLE.length]}
                title={s.name}
                meta={[
                  s.availableDays?.length && { icon: CalendarDays, text: s.availableDays.length === 7 ? 'Every day' : s.availableDays.join(', ') },
                  (s.availableHours?.start || s.availableHours?.end) && { icon: Clock, text: `${s.availableHours.start || ''}–${s.availableHours.end || ''}` },
                ]}
                description={s.description}
                price={s.price != null ? { amount: s.price, unit: s.pricingType || '' } : null}
                actions={<AddToTripButton snapshot={snapshotFor('service', s)} label="Add" />}
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
