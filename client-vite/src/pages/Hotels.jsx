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

const ART_CYCLE = ['slow', 'ocean', 'romance', 'culture', 'adventure'];

const TYPES = [
  { id: '', label: 'All stays' },
  { id: 'hotel', label: 'Hotels' },
  { id: 'airbnb', label: 'Airbnbs' },
  { id: 'villa', label: 'Villas' },
];
const RATINGS = [
  { id: 0, label: 'Any rating' },
  { id: 3, label: '3★ and up' },
  { id: 4, label: '4★ and up' },
  { id: 5, label: '5★' },
];

const locationText = (l) => (!l ? null : typeof l === 'string' ? l : l.address || null);

export default function Hotels() {
  const { items, loading, error, retry } = useListing('/hotels');
  const [type, setType] = useState('');
  const [minStars, setMinStars] = useState(0);

  const filtered = useMemo(
    () => items.filter((a) => (!type || a.type === type) && (!minStars || (a.stars || 0) >= minStars)),
    [items, type, minStars]
  );

  return (
    <>
      <Seo title="Where to stay in Watamu" description="Hotels, beach villas and Airbnbs in Watamu, Kenya. Add a stay to your trip and our local team includes it in your quote." />
      <PageHero eyebrow="Stays" title="Where to stay in Watamu" lede="Beach hotels, private villas and homes by the creek. Add one to your trip and we’ll include it in your quote." />

      <Container size="wide" className="py-10 lg:py-14">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Type of stay">
            {TYPES.map((t) => (
              <Chip key={t.id || 'all'} selected={type === t.id} onClick={() => setType(t.id)}>
                {t.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Star rating">
            {RATINGS.map((r) => (
              <Chip key={r.id} selected={minStars === r.id} onClick={() => setMinStars(r.id)}>
                {r.label}
              </Chip>
            ))}
          </div>
        </div>

        {error ? (
          <ErrorState what="stays" onRetry={retry} />
        ) : loading ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title="No stays match those filters" text="Try another type or rating — or tell us what you’re looking for and we’ll find it.">
            <Button variant="outline" onClick={() => { setType(''); setMinStars(0); }}>Show all stays</Button>
            <Button href="mailto:hello@exploringwatamu.com?subject=Help%20me%20find%20a%20stay">Ask our team</Button>
            <WhatsAppButton message={generalMessage('finding a stay')}>Ask on WhatsApp</WhatsAppButton>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a, i) => {
              const loc = locationText(a.location);
              const whatsapp = a.whatsapp || a.contact?.whatsapp;
              const email = a.email || a.contact?.email;
              return (
                <ListingCard
                  key={a._id}
                  images={a.images}
                  art={ART_CYCLE[i % ART_CYCLE.length]}
                  title={a.name}
                  badge={a.type ? <Badge tone="glass" className="capitalize">{a.type}</Badge> : null}
                  meta={[
                    a.stars > 0 && { icon: Star, text: `${a.stars}-star` },
                    loc && { icon: MapPin, text: loc },
                  ]}
                  description={a.description}
                  chips={a.facilities || []}
                  price={a.pricePerNight != null ? { amount: a.pricePerNight, unit: 'per night' } : null}
                  reviews={{ listingType: 'stay', listingId: a._id, stats: a.reviewStats }}
                  actions={
                    <>
                      <WhatsAppButton iconOnly className="size-9" message={listingEnquiry('stay', a)} label={`Ask about ${a.name} on WhatsApp`} />
                      <AddToTripButton snapshot={snapshotFor('stay', a)} label="Add stay" />
                    </>
                  }
                >
                  {a.roomTypes?.length > 0 && (
                    <p className="mt-3 text-xs text-ocean-900/60">
                      Rooms: {a.roomTypes.slice(0, 3).map((r) => r.name + (r.price ? ` (KES ${Number(r.price).toLocaleString('en-KE')})` : '')).join(' · ')}
                    </p>
                  )}
                  {a.location?.mapUrl && (
                    <a href={a.location.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-lagoon-700 hover:underline">
                      View on map <ExternalLink className="size-3" />
                    </a>
                  )}
                  <ContactLinks whatsapp={whatsapp} email={email} subject={`Enquiry: ${a.name}`} />
                </ListingCard>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
