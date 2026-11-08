import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { useCatalog, getResidency } from '@/lib/catalog';
import { rankExperiences } from '@/lib/match';
import { Container, SectionHeading } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import ExperienceCard from '@/components/experience/ExperienceCard';

/** Homepage shelf: best-matched experiences for this visitor (or the latest, without a profile). */
export default function PickedForYou() {
  const { profile } = useVibeProfile();
  const { items, loading, error } = useCatalog();
  const top = useMemo(() => rankExperiences(items, profile).slice(0, 6), [items, profile]);

  if (error || (!loading && top.length === 0)) return null;

  return (
    <section className="py-20 lg:py-24">
      <Container size="wide">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={profile ? 'Picked for you' : 'Start here'}
            title={profile ? 'Your best matches in Watamu' : 'Popular experiences'}
            lede={profile ? 'Ranked by your vibes, who you’re with and how long you’re staying.' : 'A few favourites to get you started.'}
          />
          <Button to="/experiences" variant="outline" className="self-start md:self-auto">
            See all <ArrowRight />
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-sand-100" />)
            : top.map(({ item, match }) => (
                <ExperienceCard key={`${item.kind}-${item.id}`} item={item} match={profile ? match : null} residency={getResidency()} />
              ))}
        </div>
      </Container>
    </section>
  );
}
