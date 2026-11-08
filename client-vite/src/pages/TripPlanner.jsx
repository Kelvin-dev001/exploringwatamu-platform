import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Minus, Plus, Plane, Share2, Sparkles, Trash2, Wand2, Check, Send, CalendarDays, Users, Mail } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { useVibeProfile } from '@/context/VibeProfileContext';
import { useCatalog, getResidency, setResidency, formatKES } from '@/lib/catalog';
import { rankExperiences } from '@/lib/match';
import { VIBES, personalHeadline, byId } from '@/lib/vibes';
import { TRANSFERS, decodeTrip, encodeTrip, estimate, hasItem, itemCount, tripSummary } from '@/lib/trip';
import { Container, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import ResidencyToggle from '@/components/experience/ResidencyToggle';
import Board from '@/components/trip/Board';
import RequestQuoteSheet from '@/components/trip/RequestQuoteSheet';
import { WaveField } from '@/components/brand/Patterns';

const SUPPORT_EMAIL = 'hello@exploringwatamu.com';
const today = () => new Date().toISOString().slice(0, 10);

function Stepper({ label, value, onChange, min = 0, max = 30 }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-ocean-900">{label}</span>
      <div className="inline-flex items-center rounded-full border border-sand-300 bg-white">
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`} className="grid size-9 place-items-center rounded-full text-ocean-900 disabled:opacity-30 hover:bg-sand-100">
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`} className="grid size-9 place-items-center rounded-full text-ocean-900 disabled:opacity-30 hover:bg-sand-100">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Ready-made starting points, generated from the live catalogue. */
function Starters({ ranked, items, profile, onStart, openOnboarding }) {
  const starters = VIBES.map((v) => {
    const vibeProfile = { vibes: [v.id], companions: profile?.companions, stay: profile?.stay || 'short' };
    const count = items.filter((x) => x.vibes.includes(v.id)).length;
    return { vibe: v, vibeProfile, count };
  }).filter((s) => s.count >= 2);

  return (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
      <p className="eyebrow">Start here</p>
      <h2 className="mt-2 font-display text-3xl text-ocean-900">Your trip is empty — let’s fill it</h2>
      <p className="mt-2 max-w-2xl text-ocean-900/65">
        We’ll sketch a plan from the experiences that suit you. Everything stays editable: drag, swap or remove anything.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {profile ? (
          <Button size="lg" onClick={() => onStart(ranked)} disabled={!items.length}>
            <Wand2 /> Start me off
          </Button>
        ) : (
          <Button size="lg" onClick={openOnboarding}>
            <Sparkles /> Tell us your vibe first
          </Button>
        )}
        <Button size="lg" variant="outline" to="/experiences">
          Browse experiences
        </Button>
      </div>
      {starters.length > 0 && (
        <>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-ocean-900/50">Or start from a ready-made plan</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {starters.map(({ vibe, vibeProfile, count }) => (
              <button
                key={vibe.id}
                type="button"
                onClick={() => onStart(rankExperiences(items, vibeProfile))}
                className="group flex items-center gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-left transition hover:border-ocean-900/30 hover:bg-white"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ocean-900 text-lagoon-300">
                  <vibe.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-display text-lg text-ocean-900">{vibe.label}</span>
                  <span className="text-sm text-ocean-900/55">{count} experiences to choose from</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TripPlanner() {
  const t = useTrip();
  const { trip } = t;
  const { profile, openOnboarding } = useVibeProfile();
  const { items } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [residency, setRes] = useState(getResidency);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const ranked = useMemo(() => rankExperiences(items, profile), [items, profile]);
  const count = itemCount(trip);
  const { total, unpriced } = estimate(trip, residency);
  const headline = personalHeadline(profile);

  // Opened from a shared link: offer to load it (or load straight away if the trip is empty).
  useEffect(() => {
    const code = params.get('plan');
    if (!code) return;
    const incoming = decodeTrip(code);
    setParams(new URLSearchParams(), { replace: true });
    if (!incoming) return;
    if (itemCount(trip) === 0) t.replace(incoming);
    else setShared(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = 'My trip planner · Exploring Watamu';
    return () => {
      document.title = 'Exploring Watamu — Your Watamu, tuned to you';
    };
  }, []);

  const start = (rankedList) => t.autoPlan(rankedList);

  const share = async () => {
    const url = `${window.location.origin}/trip?plan=${encodeTrip(trip)}`;
    try {
      if (navigator.share) await navigator.share({ title: 'My Watamu trip', url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      /* user cancelled */
    }
  };

  // Email fallback, offered only if the quote form can't be reached.
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Quote request: my Watamu trip')}&body=${encodeURIComponent(tripSummary(trip, { headline }))}`;

  const missingTransfers = count > 0 && !hasItem(trip, TRANSFERS.in.key) && !hasItem(trip, TRANSFERS.out.key);

  return (
    <>
      <section className="relative overflow-hidden bg-ocean-900 text-sand-50">
        <WaveField className="absolute inset-0 text-ocean-800" rows={8} gap={18} />
        <Container size="wide" className="relative py-12 lg:py-16">
          <p className="eyebrow !text-lagoon-300">My Watamu trip</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{headline || 'Plan your Watamu days'}</h1>
          <p className="mt-4 max-w-2xl text-lg text-sand-50/70">
            Drag experiences onto days, keep some days free, and send it to us. Our local team checks availability and prices the whole trip.
          </p>
          {profile && (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.vibes.map((id) => {
                const v = byId(VIBES, id);
                return v ? (
                  <Badge key={id} tone="glass">
                    <v.icon className="text-coral-500" /> {v.label}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </Container>
      </section>

      <Container size="wide" className="grid gap-8 py-10 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          {shared && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-lagoon-50 p-4 text-sm text-lagoon-700">
              <Share2 className="size-4" /> Someone shared a trip plan with you.
              <Button size="sm" onClick={() => { t.replace(shared); setShared(null); }}>
                Use their plan
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShared(null)}>
                Keep mine
              </Button>
            </div>
          )}

          {/* When & who */}
          <div className="grid gap-4 rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 shadow-soft md:grid-cols-[1fr_1fr_1.1fr]">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ocean-900">
                <CalendarDays className="size-4 text-lagoon-600" /> Arriving
              </span>
              <input
                type="date"
                min={today()}
                value={trip.arrival}
                onChange={(e) => t.setDates(e.target.value, trip.departure && trip.departure >= e.target.value ? trip.departure : e.target.value)}
                className="h-11 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 text-ocean-900"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ocean-900">
                <CalendarDays className="size-4 text-lagoon-600" /> Leaving
              </span>
              <input
                type="date"
                min={trip.arrival || today()}
                value={trip.departure}
                onChange={(e) => t.setDates(trip.arrival || e.target.value, e.target.value)}
                className="h-11 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 text-ocean-900"
              />
              {!trip.arrival && (
                <span className="mt-2 flex items-center justify-between text-xs text-ocean-900/55">
                  No dates yet? Plan {trip.days.length} day{trip.days.length === 1 ? '' : 's'}
                  <span className="inline-flex gap-1">
                    <button type="button" className="rounded-full border border-sand-300 px-2" onClick={() => t.setDayCount(trip.days.length - 1)} aria-label="One day fewer">−</button>
                    <button type="button" className="rounded-full border border-sand-300 px-2" onClick={() => t.setDayCount(trip.days.length + 1)} aria-label="One day more">+</button>
                  </span>
                </span>
              )}
            </label>
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ocean-900">
                <Users className="size-4 text-lagoon-600" /> Travellers
              </span>
              <Stepper label="Adults" value={trip.adults} min={1} onChange={(n) => t.setTravellers(n, trip.children)} />
              <Stepper label="Children" value={trip.children} onChange={(n) => t.setTravellers(trip.adults, n)} />
            </div>
          </div>

          {count === 0 ? (
            <Starters ranked={ranked} items={items} profile={profile} onStart={start} openOnboarding={openOnboarding} />
          ) : (
            <>
              {missingTransfers && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-lagoon-200 bg-lagoon-50 p-4">
                  <Plane className="size-5 text-lagoon-600" />
                  <p className="flex-1 text-sm text-ocean-900">
                    <span className="font-semibold">Flying into Malindi or Mombasa?</span> Add airport pick-up and drop-off and we’ll include them in your quote.
                  </p>
                  <Button size="sm" variant="ocean" onClick={t.addTransfers}>
                    <Plus /> Add transfers
                  </Button>
                </div>
              )}
              <Board />
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ocean-900">Anything we should know?</span>
                <textarea
                  rows={3}
                  value={trip.notes}
                  onChange={(e) => t.setNotes(e.target.value)}
                  placeholder="Where you’re staying, dietary needs, celebrations, accessibility…"
                  className="w-full rounded-2xl border border-sand-300 bg-white p-4 text-ocean-900"
                />
              </label>
            </>
          )}
        </div>

        {/* Summary */}
        <aside className="xl:sticky xl:top-28 xl:self-start">
          <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft">
            <p className="font-display text-2xl text-ocean-900">Your trip</p>
            <p className="mt-1 text-sm text-ocean-900/55">
              {count} item{count === 1 ? '' : 's'} · {trip.days.length} day{trip.days.length === 1 ? '' : 's'} · {trip.adults + trip.children} traveller{trip.adults + trip.children === 1 ? '' : 's'}
            </p>
            <ResidencyToggle
              value={residency}
              onChange={(v) => {
                setRes(v);
                setResidency(v);
              }}
              className="mt-5 w-full [&>button]:flex-1"
            />
            <div className="mt-5 border-t border-sand-200 pt-5">
              <p className="text-sm text-ocean-900/55">Estimated from</p>
              <p className="font-display text-4xl text-ocean-900">{formatKES(total)}</p>
              {unpriced > 0 && <p className="mt-1 text-xs text-ocean-900/55">+ {unpriced} item{unpriced === 1 ? '' : 's'} priced in your quote</p>}
              <p className="mt-2 text-xs text-ocean-900/50">Indicative only. Your quote confirms availability and the final price.</p>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={() => setRequestOpen(true)} disabled={!count}>
              <Send /> Request my quote
            </Button>
            {trip.lastRequest && (
              <p className="mt-3 rounded-xl bg-lagoon-50 p-3 text-xs text-lagoon-700">
                Sent as <span className="font-mono font-semibold">{trip.lastRequest.reference}</span>. Changed something? Send it again and we’ll use the latest version.
              </p>
            )}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ocean-900/55">
              <Check className="size-3.5 text-lagoon-600" /> No payment until you confirm
            </p>
            {count > 0 && (
              <div className="mt-5 flex gap-2 border-t border-sand-200 pt-5">
                <Button variant="outline" size="sm" className="flex-1" onClick={share}>
                  {copied ? <Check /> : <Share2 />} {copied ? 'Link copied' : 'Share plan'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.confirm('Clear your whole trip?') && t.clear()}
                  aria-label="Clear trip"
                >
                  <Trash2 /> Clear
                </Button>
              </div>
            )}
            {count > 0 && (
              <a href={mailHref} className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ocean-900/45 hover:text-ocean-900">
                <Mail className="size-3.5" /> Prefer email? Send it from your inbox
              </a>
            )}
          </div>
        </aside>
      </Container>

      <RequestQuoteSheet open={requestOpen} onOpenChange={setRequestOpen} residency={residency} />
    </>
  );
}
