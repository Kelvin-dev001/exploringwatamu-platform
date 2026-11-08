import { useMemo } from 'react';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { useCatalog, getResidency } from '@/lib/catalog';
import { rankExperiences } from '@/lib/match';
import PageHero from '@/components/listing/PageHero';
import { GridSkeleton, ErrorState, EmptyState } from '@/components/listing/States';
import ExperienceCard from '@/components/experience/ExperienceCard';
import Seo from '@/components/seo/Seo';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';

export default function GroupTrips() {
  const { profile } = useVibeProfile();
  const { items, loading, error, retry } = useCatalog();
  const trips = useMemo(() => rankExperiences(items.filter((x) => x.kind === 'group'), profile), [items, profile]);

  return (
    <>
      <Seo title="Group trips in Watamu" description="Join scheduled group adventures in Watamu, Kenya — reef weekends, dhow parties and more with other travellers. Request your spot; pay after we confirm." />
      <PageHero
        tone="ocean"
        eyebrow="Group trips"
        title="Come for the coast, leave with a crew"
        lede="Scheduled adventures with a small group of travellers. Request your spot — you only pay once we confirm it."
      />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what="group trips" onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={3} />
        ) : trips.length === 0 ? (
          <EmptyState title="New group trips are on the way" text="In the meantime, build your own trip and we’ll price it for you.">
            <Button to="/experiences">Browse experiences</Button>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {trips.map(({ item, match }) => (
              <ExperienceCard key={item.id} item={item} match={profile ? match : null} residency={getResidency()} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
