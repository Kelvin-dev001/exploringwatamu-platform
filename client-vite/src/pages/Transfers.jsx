import { CarFront, Users, Plane } from 'lucide-react';
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

export default function Transfers() {
  const { items, loading, error, retry } = useListing('/transfers');
  return (
    <>
      <Seo title="Airport & hotel transfers" description="Private transfers from Malindi and Mombasa airports to Watamu, and between hotels. Add one to your trip and it’s included in your quote." />
      <PageHero eyebrow="Getting here" title="Airport & hotel transfers" lede="Private, door-to-door rides from Malindi or Mombasa to your stay — added to your trip in one tap." />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what="transfers" onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState title="Transfers are arranged on request" text="Tell us your flight and where you’re staying — we’ll arrange the ride and include it in your quote.">
            <Button to="/trip">Add pick-up to my trip</Button>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((t, i) => (
              <ListingCard
                key={t._id}
                images={t.vehicle?.image ? [t.vehicle.image] : []}
                art={ART_CYCLE[i % ART_CYCLE.length]}
                title={t.route}
                meta={[t.vehicle?.name && { icon: CarFront, text: t.vehicle.name }, t.vehicle?.capacity && { icon: Users, text: `${t.vehicle.capacity} seats` }, { icon: Plane, text: 'Private transfer' }]}
                description={t.description}
                price={t.price != null ? { amount: t.price, unit: 'per vehicle', prefix: '' } : null}
                actions={<AddToTripButton snapshot={snapshotFor('transfer', t)} label="Add transfer" />}
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
