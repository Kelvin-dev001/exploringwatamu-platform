import { CarFront, Users } from 'lucide-react';
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

export default function CarHire() {
  const { items, loading, error, retry } = useListing('/carhire');
  return (
    <>
      <Seo title="Car hire in Watamu" description="Hire a car to explore Watamu, Malindi and the Kenyan coast at your own pace. Add it to your trip for one combined quote." />
      <PageHero eyebrow="Getting around" title="Car hire" lede="Explore Gede, Malindi and the forest at your own pace. Self-drive or with a driver." />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what="cars" onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState title="Cars are arranged on request" text="Tell us your dates and what you need — we’ll include a car in your quote.">
            <Button href="mailto:hello@exploringwatamu.com?subject=Car%20hire%20request">Ask our team</Button>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((c, i) => (
              <ListingCard
                key={c._id}
                images={c.vehicle?.image ? [c.vehicle.image] : []}
                art={ART_CYCLE[i % ART_CYCLE.length]}
                title={c.vehicle?.name || 'Vehicle'}
                meta={[c.vehicle?.capacity && { icon: Users, text: `${c.vehicle.capacity} seats` }, c.vehicle?.type && { icon: CarFront, text: c.vehicle.type }]}
                description={c.description}
                price={c.dailyRate != null ? { amount: c.dailyRate, unit: 'per day' } : null}
                actions={<AddToTripButton snapshot={snapshotFor('carhire', c)} label="Add car" />}
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
