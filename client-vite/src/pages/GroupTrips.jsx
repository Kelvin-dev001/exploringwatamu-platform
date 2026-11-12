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
import { useI18n } from '@/i18n';
import messages from '@/locales/groupTrips';

export default function GroupTrips() {
  const { t } = useI18n(messages);
  const { profile } = useVibeProfile();
  const { items, loading, error, retry } = useCatalog();
  const trips = useMemo(() => rankExperiences(items.filter((x) => x.kind === 'group'), profile), [items, profile]);

  return (
    <>
      <Seo route="/group-trips" />
      <PageHero
        tone="ocean"
        eyebrow={t('listEyebrow')}
        title={t('listTitle')}
        lede={t('listLede')}
      />
      <Container size="wide" className="py-10 lg:py-14">
        {error ? (
          <ErrorState what={t('whatTrips')} onRetry={retry} />
        ) : loading ? (
          <GridSkeleton count={3} />
        ) : trips.length === 0 ? (
          <EmptyState title={t('emptyTitle')} text={t('emptyText')}>
            <Button to="/experiences">{t('browse')}</Button>
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
