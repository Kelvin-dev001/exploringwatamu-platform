import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Sparkles, RotateCcw, X } from 'lucide-react';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { useCatalog, LENGTHS, getResidency, setResidency, priceFor } from '@/lib/catalog';
import { rankExperiences } from '@/lib/match';
import { VIBES, COMPANIONS, byId, personalHeadline } from '@/lib/vibes';
import { Container, Chip, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import ExperienceCard from '@/components/experience/ExperienceCard';
import ResidencyToggle from '@/components/experience/ResidencyToggle';
import Seo from '@/components/seo/Seo';
import { SlowNotice } from '@/components/listing/States';
import { WhatsAppButton } from '@/components/contact/WhatsApp';
import { generalMessage } from '@/lib/whatsapp';

import { ArchBand } from '@/components/brand/Patterns';
import { useI18n } from '@/i18n';
import messages from '@/locales/experiences';

// Labels are message keys (locales/experiences.js).
const SORTS = [
  { id: 'match', label: 'sortMatch' },
  { id: 'price-asc', label: 'sortPriceAsc' },
  { id: 'price-desc', label: 'sortPriceDesc' },
  { id: 'newest', label: 'sortNewest' },
];
const TYPES = [
  { id: 'all', label: 'typeAll' },
  { id: 'tour', label: 'typeTour' },
  { id: 'group', label: 'typeGroup' },
];

/* Filters live in the URL so a filtered view can be shared or bookmarked. */
function useFilters() {
  const [params, setParams] = useSearchParams();
  const list = (k) => (params.get(k) ? params.get(k).split(',').filter(Boolean) : []);
  const filters = {
    vibes: list('vibe'),
    who: params.get('who') || '',
    lengths: list('length'),
    type: params.get('type') || 'all',
    sort: params.get('sort') || 'match',
  };
  const update = (patch) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    if (next.vibes.length) p.set('vibe', next.vibes.join(','));
    if (next.who) p.set('who', next.who);
    if (next.lengths.length) p.set('length', next.lengths.join(','));
    if (next.type !== 'all') p.set('type', next.type);
    if (next.sort !== 'match') p.set('sort', next.sort);
    setParams(p, { replace: true });
  };
  const toggle = (key, id) =>
    update({ [key]: filters[key].includes(id) ? filters[key].filter((x) => x !== id) : [...filters[key], id] });
  const activeCount = filters.vibes.length + (filters.who ? 1 : 0) + filters.lengths.length + (filters.type !== 'all' ? 1 : 0);
  const reset = () => setParams(new URLSearchParams(), { replace: true });
  return { filters, update, toggle, activeCount, reset };
}

function FilterGroup({ title, children }) {
  return (
    <div className="border-b border-sand-200 py-5 first:pt-0 last:border-0">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ocean-900/60">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterPanel({ filters, toggle, update }) {
  const { t } = useI18n(messages);
  return (
    <div>
      <FilterGroup title={t('filterVibe')}>
        {VIBES.map((v) => (
          <Chip key={v.id} icon={v.icon} selected={filters.vibes.includes(v.id)} onClick={() => toggle('vibes', v.id)}>
            {v.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title={t('filterWho')}>
        {COMPANIONS.map((c) => (
          <Chip key={c.id} selected={filters.who === c.id} onClick={() => update({ who: filters.who === c.id ? '' : c.id })}>
            {c.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title={t('filterLength')}>
        {LENGTHS.map((l) => (
          <Chip key={l.id} selected={filters.lengths.includes(l.id)} onClick={() => toggle('lengths', l.id)}>
            {l.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title={t('filterType')}>
        {TYPES.map((type) => (
          <Chip key={type.id} selected={filters.type === type.id} onClick={() => update({ type: type.id })}>
            {t(type.label)}
          </Chip>
        ))}
      </FilterGroup>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white p-2.5">
      <div className="aspect-[4/3] animate-pulse rounded-[1rem] bg-sand-100" />
      <div className="space-y-3 p-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-sand-100" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-sand-100" />
        <div className="h-3 w-full animate-pulse rounded bg-sand-100" />
      </div>
    </div>
  );
}

export default function Experiences() {
  const { t } = useI18n(messages);
  const { profile, openOnboarding } = useVibeProfile();
  const { items, loading, error, retry } = useCatalog();
  const { filters, update, toggle, activeCount, reset } = useFilters();
  const [residency, setRes] = useState(getResidency);
  const [sheetOpen, setSheetOpen] = useState(false);

  const changeResidency = (v) => {
    setRes(v);
    setResidency(v);
  };

  const results = useMemo(() => {
    const ranked = rankExperiences(items, profile).filter(({ item }) => {
      if (filters.type !== 'all' && item.kind !== filters.type) return false;
      if (filters.vibes.length && !item.vibes.some((v) => filters.vibes.includes(v))) return false;
      if (filters.who && item.suits.length && !item.suits.includes(filters.who)) return false;
      if (filters.lengths.length && !filters.lengths.includes(item.lengthBucket)) return false;
      return true;
    });
    const price = (x) => priceFor(x.item, residency) ?? Number.POSITIVE_INFINITY;
    if (filters.sort === 'price-asc') ranked.sort((a, b) => price(a) - price(b));
    if (filters.sort === 'price-desc') ranked.sort((a, b) => (priceFor(b.item, residency) ?? -1) - (priceFor(a.item, residency) ?? -1));
    if (filters.sort === 'newest') ranked.sort((a, b) => new Date(b.item.createdAt || 0) - new Date(a.item.createdAt || 0));
    return ranked;
  }, [items, profile, filters, residency]);

  const headline = personalHeadline(profile);
  const greatCount = results.filter((r) => r.match.great).length;

  return (
    <>
      <Seo route="/experiences" />
      <section className="grain border-b border-sand-200">
        <Container size="wide" className="pb-10 pt-12 lg:pb-14 lg:pt-16">
          <p className="eyebrow">{profile ? t('eyebrowYours') : t('eyebrow')}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[1.05] text-ocean-900 sm:text-5xl lg:text-6xl">
            {profile ? t('titleYours') : t('title')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ocean-900/65">
            {headline ? t('ledeYours', { headline }) : t('lede')}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {profile ? (
              <>
                {profile.vibes.map((id) => {
                  const v = byId(VIBES, id);
                  return v ? (
                    <Badge key={id} tone="glass" className="border border-sand-200">
                      <v.icon className="text-coral-500" /> {v.label}
                    </Badge>
                  ) : null;
                })}
                <Button variant="link" onClick={openOnboarding}>
                  {t('change')}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={openOnboarding}>
                <Sparkles /> {t('personalise')}
              </Button>
            )}
          </div>
        </Container>
      </section>

      <Container size="wide" className="grid gap-10 py-10 lg:grid-cols-[17rem_1fr] lg:py-14">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-display text-2xl text-ocean-900">{t('filter')}</p>
              {activeCount > 0 && (
                <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm font-semibold text-coral-600 hover:text-coral-700">
                  <RotateCcw className="size-3.5" /> {t('reset')}
                </button>
              )}
            </div>
            <FilterPanel filters={filters} toggle={toggle} update={update} />
          </div>
        </aside>

        <div>
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal /> {activeCount ? t('filtersCount', { count: activeCount }) : t('filters')}
            </Button>
            <p className="text-sm text-ocean-900/60" aria-live="polite">
              {loading ? t('loadingDots') : t('results', { count: results.length })}
              {!loading && profile && greatCount > 0 && <span className="text-lagoon-700"> · {t('greatMatches', { count: greatCount })}</span>}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <ResidencyToggle value={residency} onChange={changeResidency} />
              <label className="sr-only" htmlFor="sort">
                {t('sortBy')}
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="h-10 rounded-full border border-sand-300 bg-white px-4 text-sm font-semibold text-ocean-900"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id === 'match' && !profile ? t('sortRecommended') : t(s.label)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {activeCount > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {filters.vibes.map((id) => (
                <button key={id} type="button" onClick={() => toggle('vibes', id)} className="inline-flex items-center gap-1 rounded-full bg-ocean-900 px-3 py-1 text-xs font-semibold text-sand-50">
                  {byId(VIBES, id)?.label} <X className="size-3" />
                </button>
              ))}
              {filters.who && (
                <button type="button" onClick={() => update({ who: '' })} className="inline-flex items-center gap-1 rounded-full bg-ocean-900 px-3 py-1 text-xs font-semibold text-sand-50">
                  {byId(COMPANIONS, filters.who)?.label} <X className="size-3" />
                </button>
              )}
              {filters.lengths.map((id) => (
                <button key={id} type="button" onClick={() => toggle('lengths', id)} className="inline-flex items-center gap-1 rounded-full bg-ocean-900 px-3 py-1 text-xs font-semibold text-sand-50">
                  {byId(LENGTHS, id)?.label} <X className="size-3" />
                </button>
              ))}
              {filters.type !== 'all' && (
                <button type="button" onClick={() => update({ type: 'all' })} className="inline-flex items-center gap-1 rounded-full bg-ocean-900 px-3 py-1 text-xs font-semibold text-sand-50">
                  {t(byId(TYPES, filters.type)?.label)} <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {error ? (
            <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-10 text-center">
              <p className="font-display text-2xl text-ocean-900">{t('loadError')}</p>
              <p className="mt-2 text-ocean-900/60">{t('checkConnection')}</p>
              <Button className="mt-6" onClick={retry}>
                {t('tryAgain')}
              </Button>
            </div>
          ) : loading ? (
            <div role="status" aria-label={t('loadingExperiences')}>
              <SlowNotice className="mb-6" />
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-sand-100/60 p-10 text-center">
              <p className="font-display text-2xl text-ocean-900">{t('emptyTitle')}</p>
              <p className="mt-2 text-ocean-900/60">{t('emptyText')}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {activeCount > 0 && (
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw /> {t('clearFilters')}
                  </Button>
                )}
                <Button href={`mailto:hello@exploringwatamu.com?subject=${encodeURIComponent(t('customSubject'))}`}>{t('askTeam')}</Button>
                <WhatsAppButton message={generalMessage('unlisted')}>{t('askWhatsAppShort')}</WhatsAppButton>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map(({ item, match }) => (
                <ExperienceCard key={`${item.kind}-${item.id}`} item={item} match={profile ? match : null} residency={residency} />
              ))}
            </div>
          )}
        </div>
      </Container>

      <ArchBand className="text-sand-300" />

      {/* Mobile filters */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="bottom" title={t('sheetTitle')}>
        <div className="px-6 pb-4">
          <FilterPanel filters={filters} toggle={toggle} update={update} />
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-sand-200 bg-sand-50 px-6 py-4">
          <Button variant="ghost" onClick={reset} disabled={!activeCount}>
            {t('reset')}
          </Button>
          <Button className="flex-1" onClick={() => setSheetOpen(false)}>
            {t('showResults', { count: results.length })}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
