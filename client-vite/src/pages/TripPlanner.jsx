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
import WhatsAppPlanSheet from '@/components/trip/WhatsAppPlanSheet';
import { WhatsAppIcon } from '@/components/contact/WhatsApp';
import { whatsappEnabled } from '@/lib/whatsapp';
import Seo from '@/components/seo/Seo';

import { WaveField } from '@/components/brand/Patterns';
import { localisePath, translate, useI18n } from '@/i18n';
import messages from '@/locales/planner';
import catalogText from '@/locales/catalog';

const SUPPORT_EMAIL = 'hello@exploringwatamu.com';
const today = () => new Date().toISOString().slice(0, 10);

function Stepper({ label, value, onChange, min = 0, max = 30 }) {
  const { t } = useI18n(messages);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-ocean-900">{label}</span>
      <div className="inline-flex items-center rounded-full border border-sand-300 bg-white">
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t('fewer', { what: label.toLowerCase() })} className="grid size-9 place-items-center rounded-full text-ocean-900 disabled:opacity-30 hover:bg-sand-100">
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t('more', { what: label.toLowerCase() })} className="grid size-9 place-items-center rounded-full text-ocean-900 disabled:opacity-30 hover:bg-sand-100">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Ready-made starting points, generated from the live catalogue. */
function Starters({ ranked, items, profile, onStart, openOnboarding }) {
  const { t } = useI18n(messages);
  const starters = VIBES.map((v) => {
    const vibeProfile = { vibes: [v.id], companions: profile?.companions, stay: profile?.stay || 'short' };
    const count = items.filter((x) => x.vibes.includes(v.id)).length;
    return { vibe: v, vibeProfile, count };
  }).filter((s) => s.count >= 2);

  return (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft sm:p-8">
      <p className="eyebrow">{t('startHere')}</p>
      <h2 className="mt-2 font-display text-3xl text-ocean-900">{t('startTitle')}</h2>
      <p className="mt-2 max-w-2xl text-ocean-900/65">{t('startText')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {profile ? (
          <Button size="lg" onClick={() => onStart(ranked)} disabled={!items.length}>
            <Wand2 /> {t('startMeOff')}
          </Button>
        ) : (
          <Button size="lg" onClick={openOnboarding}>
            <Sparkles /> {t('vibeFirst')}
          </Button>
        )}
        <Button size="lg" variant="outline" to="/experiences">
          {t('browse')}
        </Button>
      </div>
      {starters.length > 0 && (
        <>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-ocean-900/60">{t('readyMade')}</p>
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
                  <span className="text-sm text-ocean-900/60">{t('toChooseFrom', { count })}</span>
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
  const { t: tr, rich, locale } = useI18n(messages);
  const tc = (key, vars) => translate(catalogText, locale, key, vars);
  const t = useTrip();
  const { trip } = t;
  const { profile, openOnboarding } = useVibeProfile();
  const { items } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [residency, setRes] = useState(getResidency);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

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

  const start = (rankedList) => t.autoPlan(rankedList);

  const share = async () => {
    const url = `${window.location.origin}${localisePath('/trip', locale)}?plan=${encodeTrip(trip)}`;
    try {
      if (navigator.share) await navigator.share({ title: tr('shareTitle'), url });
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
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(tr('mailSubject'))}&body=${encodeURIComponent(tripSummary(trip, { headline }))}`;

  const missingTransfers = count > 0 && !hasItem(trip, TRANSFERS.in.key) && !hasItem(trip, TRANSFERS.out.key);

  return (
    <>
      <Seo route="/trip" />
      <section className="relative overflow-hidden bg-ocean-900 text-sand-50">
        <WaveField className="absolute inset-0 text-ocean-800" rows={8} gap={18} />
        <Container size="wide" className="relative py-12 lg:py-16">
          <p className="eyebrow !text-lagoon-300">{tr('plannerEyebrow')}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{headline || tr('plannerTitle')}</h1>
          <p className="mt-4 max-w-2xl text-lg text-sand-50/70">{tr('plannerLede')}</p>
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
              <Share2 className="size-4" /> {tr('sharedPlan')}
              <Button size="sm" onClick={() => { t.replace(shared); setShared(null); }}>
                {tr('useTheirs')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShared(null)}>
                {tr('keepMine')}
              </Button>
            </div>
          )}

          {/* When & who */}
          <div className="grid gap-4 rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 shadow-soft md:grid-cols-[1fr_1fr_1.1fr]">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ocean-900">
                <CalendarDays className="size-4 text-lagoon-600" /> {tr('arriving')}
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
                <CalendarDays className="size-4 text-lagoon-600" /> {tr('leaving')}
              </span>
              <input
                type="date"
                min={trip.arrival || today()}
                value={trip.departure}
                onChange={(e) => t.setDates(trip.arrival || e.target.value, e.target.value)}
                className="h-11 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 text-ocean-900"
              />
              {!trip.arrival && (
                <span className="mt-2 flex items-center justify-between text-xs text-ocean-900/60">
                  {tr('noDates', { count: trip.days.length })}
                  <span className="inline-flex gap-1">
                    <button type="button" className="rounded-full border border-sand-300 px-2" onClick={() => t.setDayCount(trip.days.length - 1)} aria-label={tr('dayFewer')}>−</button>
                    <button type="button" className="rounded-full border border-sand-300 px-2" onClick={() => t.setDayCount(trip.days.length + 1)} aria-label={tr('dayMore')}>+</button>
                  </span>
                </span>
              )}
            </label>
            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ocean-900">
                <Users className="size-4 text-lagoon-600" /> {tr('travellers')}
              </span>
              <Stepper label={tr('adults')} value={trip.adults} min={1} onChange={(n) => t.setTravellers(n, trip.children)} />
              <Stepper label={tr('children')} value={trip.children} onChange={(n) => t.setTravellers(trip.adults, n)} />
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
                    <span className="font-semibold">{tr('flyingIn')}</span> {tr('flyingInText')}
                  </p>
                  <Button size="sm" variant="ocean" onClick={t.addTransfers}>
                    <Plus /> {tr('addTransfers')}
                  </Button>
                </div>
              )}
              <Board />
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ocean-900">{tr('anything')}</span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={trip.notes}
                  onChange={(e) => t.setNotes(e.target.value)}
                  placeholder={tr('notesPlaceholder')}
                  className="w-full rounded-2xl border border-sand-300 bg-white p-4 text-ocean-900"
                />
              </label>
            </>
          )}
        </div>

        {/* Summary */}
        <aside className="xl:sticky xl:top-28 xl:self-start">
          <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft">
            <p className="font-display text-2xl text-ocean-900">{tr('yourTrip')}</p>
            <p className="mt-1 text-sm text-ocean-900/60">
              {tr('tripFacts', { items: tr('items', { count }), days: tc('days', { count: trip.days.length }), travellers: tr('travellersCount', { count: trip.adults + trip.children }) })}
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
              <p className="text-sm text-ocean-900/60">{tr('estimatedFrom')}</p>
              <p className="font-display text-4xl text-ocean-900">{formatKES(total)}</p>
              {unpriced > 0 && <p className="mt-1 text-xs text-ocean-900/60">{tr('pricedInQuote', { count: unpriced })}</p>}
              <p className="mt-2 text-xs text-ocean-900/60">{tr('indicative')}</p>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={() => setRequestOpen(true)} disabled={!count}>
              <Send /> {tr('requestQuote')}
            </Button>
            {count > 0 && whatsappEnabled() && (
              <Button variant="outline" className="mt-3 w-full" onClick={() => setWhatsappOpen(true)}>
                <WhatsAppIcon className="text-whatsapp-600" /> {tr('sendWhatsApp')}
              </Button>
            )}
            {trip.lastRequest && (
              <p className="mt-3 rounded-xl bg-lagoon-50 p-3 text-xs text-lagoon-700">
                {rich('sentAs', { ref: (text) => <span className="font-mono font-semibold">{text}</span> }, { reference: trip.lastRequest.reference })}
              </p>
            )}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ocean-900/60">
              <Check className="size-3.5 text-lagoon-600" /> {tr('noPayment')}
            </p>
            {count > 0 && (
              <div className="mt-5 flex gap-2 border-t border-sand-200 pt-5">
                <Button variant="outline" size="sm" className="flex-1" onClick={share}>
                  {copied ? <Check /> : <Share2 />} {copied ? tr('linkCopied') : tr('sharePlan')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.confirm(tr('clearConfirm')) && t.clear()}
                  aria-label={tr('clearTrip')}
                >
                  <Trash2 /> {tr('clear')}
                </Button>
              </div>
            )}
            {count > 0 && (
              <a href={mailHref} className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ocean-900/60 hover:text-ocean-900">
                <Mail className="size-3.5" /> {tr('emailInstead')}
              </a>
            )}
          </div>
        </aside>
      </Container>

      <RequestQuoteSheet open={requestOpen} onOpenChange={setRequestOpen} residency={residency} />
      <WhatsAppPlanSheet open={whatsappOpen} onOpenChange={setWhatsappOpen} />
    </>
  );
}
