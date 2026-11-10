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

import { ArchBand } from '@/components/brand/Patterns';
import { cn } from '@/lib/utils';

const SORTS = [
  { id: 'match', label: 'Best match' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest' },
];
const TYPES = [
  { id: 'all', label: 'Everything' },
  { id: 'tour', label: 'Experiences' },
  { id: 'group', label: 'Group trips' },
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
  return (
    <div>
      <FilterGroup title="Vibe">
        {VIBES.map((v) => (
          <Chip key={v.id} icon={v.icon} selected={filters.vibes.includes(v.id)} onClick={() => toggle('vibes', v.id)}>
            {v.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Great for">
        {COMPANIONS.map((c) => (
          <Chip key={c.id} selected={filters.who === c.id} onClick={() => update({ who: filters.who === c.id ? '' : c.id })}>
            {c.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Length">
        {LENGTHS.map((l) => (
          <Chip key={l.id} selected={filters.lengths.includes(l.id)} onClick={() => toggle('lengths', l.id)}>
            {l.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Type">
        {TYPES.map((t) => (
          <Chip key={t.id} selected={filters.type === t.id} onClick={() => update({ type: t.id })}>
            {t.label}
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
      <Seo title="Experiences in Watamu" description="Snorkelling in the marine park, sunset dhows on Mida Creek, Gede Ruins and more — ranked for how you like to travel. Add them to your trip for one tailored quote." />
      <section className="grain border-b border-sand-200">
        <Container size="wide" className="pb-10 pt-12 lg:pb-14 lg:pt-16">
          <p className="eyebrow">{profile ? 'Sorted for you' : 'The Watamu store'}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[1.05] text-ocean-900 sm:text-5xl lg:text-6xl">
            {profile ? 'Experiences picked for your Watamu' : 'Experiences in Watamu'}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ocean-900/65">
            {headline
              ? `${headline} Best matches first — pick what you love and we’ll price the whole trip.`
              : 'Reef, creek, forest and old Swahili towns. Tell us how you travel and we’ll put the best matches first.'}
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
                  Change
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={openOnboarding}>
                <Sparkles /> Personalise my results
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
              <p className="font-display text-2xl text-ocean-900">Filter</p>
              {activeCount > 0 && (
                <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm font-semibold text-coral-600 hover:text-coral-700">
                  <RotateCcw className="size-3.5" /> Reset
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
              <SlidersHorizontal /> Filters{activeCount ? ` (${activeCount})` : ''}
            </Button>
            <p className="text-sm text-ocean-900/60" aria-live="polite">
              {loading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
              {!loading && profile && greatCount > 0 && <span className="text-lagoon-700"> · {greatCount} great matches</span>}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <ResidencyToggle value={residency} onChange={changeResidency} />
              <label className="sr-only" htmlFor="sort">
                Sort by
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="h-10 rounded-full border border-sand-300 bg-white px-4 text-sm font-semibold text-ocean-900"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id === 'match' && !profile ? 'Recommended' : s.label}
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
                  {byId(TYPES, filters.type)?.label} <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {error ? (
            <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-10 text-center">
              <p className="font-display text-2xl text-ocean-900">We couldn’t load experiences</p>
              <p className="mt-2 text-ocean-900/60">Check your connection and try again.</p>
              <Button className="mt-6" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div role="status" aria-label="Loading experiences">
              <SlowNotice className="mb-6" />
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-sand-100/60 p-10 text-center">
              <p className="font-display text-2xl text-ocean-900">Nothing matches those filters yet</p>
              <p className="mt-2 text-ocean-900/60">Try removing a filter — or tell us what you’re after and we’ll arrange it.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {activeCount > 0 && (
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw /> Clear filters
                  </Button>
                )}
                <Button href="mailto:hello@exploringwatamu.com?subject=Custom%20experience%20request">Ask our team</Button>
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
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="bottom" title="Filter experiences">
        <div className="px-6 pb-4">
          <FilterPanel filters={filters} toggle={toggle} update={update} />
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-sand-200 bg-sand-50 px-6 py-4">
          <Button variant="ghost" onClick={reset} disabled={!activeCount}>
            Reset
          </Button>
          <Button className="flex-1" onClick={() => setSheetOpen(false)}>
            Show {results.length} {results.length === 1 ? 'result' : 'results'}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
