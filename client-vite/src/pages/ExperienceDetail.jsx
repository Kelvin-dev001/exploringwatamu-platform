import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Gauge, Backpack, CalendarRange, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { loadExperience, useCatalog, getResidency, setResidency, formatKES } from '@/lib/catalog';
import { scoreExperience, rankExperiences } from '@/lib/match';
import { VIBES, COMPANIONS, byId } from '@/lib/vibes';
import { Container, Badge, SectionHeading } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import ExperienceCard, { VibeArt } from '@/components/experience/ExperienceCard';
import ResidencyToggle from '@/components/experience/ResidencyToggle';
import AddToTripButton from '@/components/trip/AddToTripButton';

const SUPPORT_EMAIL = 'hello@exploringwatamu.com';
const ENERGY_LABEL = { easy: 'Easy going', moderate: 'Moderate', active: 'Active' };

function Gallery({ item }) {
  const [active, setActive] = useState(0);
  const images = item.gallery;
  if (!images.length) return <VibeArt vibe={item.vibes[0]} className="aspect-[16/10] w-full rounded-[var(--radius-card)]" label={item.title} />;
  return (
    <div>
      <div className="overflow-hidden rounded-[var(--radius-card)] bg-sand-100">
        <img src={images[active]} alt={`${item.title} — photo ${active + 1}`} className="aspect-[16/10] w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${i === active ? 'border-coral-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={src} alt="" loading="lazy" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PricePanel({ item }) {
  const [residency, setRes] = useState(getResidency);
  const raw = item.raw || {};
  const adult = residency === 'resident' ? raw.priceResidentAdult : raw.priceForeignerAdult;
  const child = residency === 'resident' ? raw.priceResidentChild : raw.priceForeignerChild;

  const subject = encodeURIComponent(`Price request: ${item.title}`);
  const body = encodeURIComponent(
    `Hi ExploringWatamu team,\n\nI'd like a price for "${item.title}".\n\nDates:\nAdults:\nChildren:\nWhere we're staying:\n\nThanks!`
  );

  return (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft">
      <ResidencyToggle
        value={residency}
        onChange={(v) => {
          setRes(v);
          setResidency(v);
        }}
        className="w-full [&>button]:flex-1"
      />
      <div className="mt-6">
        <p className="text-sm text-ocean-900/55">from</p>
        <p className="font-display text-4xl text-ocean-900">{adult != null ? formatKES(adult) : 'On request'}</p>
        <p className="text-sm text-ocean-900/55">per adult{child != null ? ` · children ${formatKES(child)}` : ''}</p>
      </div>
      <AddToTripButton item={item} size="lg" full className="mt-6" />
      <Button variant="link" className="mt-4 w-full justify-center text-sm" href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>
        <Mail /> Or just ask about this one
      </Button>
      <ul className="mt-5 space-y-2 text-sm text-ocean-900/65">
        <li className="flex gap-2">
          <ShieldCheck className="size-4 shrink-0 text-lagoon-600" /> No payment until you confirm
        </li>
        <li className="flex gap-2">
          <Check className="size-4 shrink-0 text-lagoon-600" /> Our local team confirms availability and sends your quote
        </li>
      </ul>
    </div>
  );
}

export default function ExperienceDetail() {
  const { id } = useParams();
  const { profile } = useVibeProfile();
  const { items } = useCatalog();
  const [state, setState] = useState({ item: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    setState({ item: null, loading: true, error: null });
    loadExperience(id)
      .then((item) => alive && setState({ item, loading: false, error: null }))
      .catch((error) => alive && setState({ item: null, loading: false, error }));
    return () => {
      alive = false;
    };
  }, [id]);

  const item = state.item;
  const match = item ? scoreExperience(item, profile) : null;

  const related = useMemo(() => {
    if (!item) return [];
    return rankExperiences(
      items.filter((x) => x.id !== item.id && x.vibes.some((v) => item.vibes.includes(v))),
      profile
    ).slice(0, 3);
  }, [items, item, profile]);

  useEffect(() => {
    if (item) document.title = `${item.title} · Exploring Watamu`;
    return () => {
      document.title = 'Exploring Watamu — Your Watamu, tuned to you';
    };
  }, [item]);

  if (state.loading) {
    return (
      <Container size="wide" className="py-16">
        <div className="h-8 w-48 animate-pulse rounded bg-sand-100" />
        <div className="mt-6 aspect-[16/10] max-w-4xl animate-pulse rounded-[var(--radius-card)] bg-sand-100" />
      </Container>
    );
  }

  if (state.error || !item) {
    return (
      <Container size="narrow" className="py-24 text-center">
        <p className="font-display text-3xl text-ocean-900">We couldn’t find that experience</p>
        <p className="mt-3 text-ocean-900/60">It may have finished for the season.</p>
        <Button to="/experiences" className="mt-8">
          See all experiences
        </Button>
      </Container>
    );
  }

  const raw = item.raw || {};
  const suits = item.suits.map((s) => byId(COMPANIONS, s)?.label).filter(Boolean);

  return (
    <>
      <Container size="wide" className="pt-8">
        <Link to="/experiences" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean-900/60 hover:text-ocean-900">
          <ArrowLeft className="size-4" /> All experiences
        </Link>
      </Container>

      <Container size="wide" className="grid gap-10 pb-16 pt-6 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <article>
          <div className="flex flex-wrap gap-2">
            {profile && match?.great && (
              <Badge tone="coral">
                <Sparkles /> Great match for you
              </Badge>
            )}
            {item.vibes.map((v) => {
              const vibe = byId(VIBES, v);
              return vibe ? (
                <Badge key={v} tone="sand">
                  <vibe.icon className="text-coral-500" /> {vibe.label}
                </Badge>
              ) : null;
            })}
          </div>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ocean-900 sm:text-5xl">{item.title}</h1>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {item.lengthLabel && (
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-lagoon-600" />
                <dt className="sr-only">Length</dt>
                <dd className="font-semibold">{item.lengthLabel}</dd>
              </div>
            )}
            {item.energy && (
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-lagoon-600" />
                <dt className="sr-only">Energy</dt>
                <dd className="font-semibold">{ENERGY_LABEL[item.energy]}</dd>
              </div>
            )}
            {raw.recommendedTimes && (
              <div className="flex items-center gap-2">
                <CalendarRange className="size-4 text-lagoon-600" />
                <dt className="sr-only">Best time</dt>
                <dd className="font-semibold">Best: {raw.recommendedTimes}</dd>
              </div>
            )}
            {suits.length > 0 && (
              <div className="flex items-center gap-2">
                <dt className="text-ocean-900/55">Great for</dt>
                <dd className="font-semibold">{suits.join(', ')}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8">
            <Gallery item={item} />
          </div>

          {/* Price panel sits here on phones, in the sidebar on desktop */}
          <div className="mt-8 lg:hidden">
            <PricePanel item={item} />
          </div>

          <div className="mt-10 max-w-3xl space-y-10">
            <section>
              <h2 className="font-display text-2xl text-ocean-900">About this experience</h2>
              <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-ocean-900/75">{item.summary}</p>
            </section>

            {raw.highlights?.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-ocean-900">Highlights</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {raw.highlights.map((h) => (
                    <li key={h} className="flex gap-3 rounded-2xl bg-sand-100 p-4">
                      <Check className="mt-0.5 size-5 shrink-0 text-coral-500" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {raw.whatToCarry?.length > 0 && (
              <section>
                <h2 className="font-display text-2xl text-ocean-900">What to bring</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {raw.whatToCarry.map((w) => (
                    <li key={w} className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm">
                      <Backpack className="size-4 text-lagoon-600" /> {w}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <PricePanel item={item} />
          </div>
        </aside>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-sand-200 bg-sand-100 py-16">
          <Container size="wide">
            <SectionHeading eyebrow="Pairs well with" title="More like this" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(({ item: r, match: m }) => (
                <ExperienceCard key={`${r.kind}-${r.id}`} item={r} match={profile ? m : null} residency={getResidency()} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
