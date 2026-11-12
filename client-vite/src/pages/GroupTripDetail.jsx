import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, CalendarDays, MapPin, Users, Check, X, ShieldCheck, Clock, Share2 } from 'lucide-react';
import { API_URL } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TravelVibeSelector from '../components/TravelVibeSelector.jsx';
import ParticipantCarousel from '../components/ParticipantCarousel.jsx';
import ECardPreview from '../components/ECardPreview.jsx';
import ReferralCard from '../components/ReferralCard.jsx';
import Seo from '@/components/seo/Seo';
import AddToTripButton from '@/components/trip/AddToTripButton';
import { Container, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import Photo from '@/components/ui/Photo';
import { VibeArt } from '@/components/experience/ExperienceCard';
import { normaliseGroupTrip } from '@/lib/catalog';
import { absoluteUrl } from '@/lib/site';
import { listingMessage } from '@/lib/whatsapp';
import { WhatsAppButton } from '@/components/contact/WhatsApp';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import { RatingBadge } from '@/components/reviews/Rating';
import { aggregateRatingLd, withRatingType } from '@/lib/reviews';
import { formatDay } from '@/lib/utils';
import { isNotFound } from '@/lib/http';
import { ErrorState, SlowNotice } from '@/components/listing/States';
import { localisePath, useI18n } from '@/i18n';
import { hasItalianContent, pickText } from '@/i18n/listingContent';
import { useVibeWords } from '@/lib/travelVibes';
import messages from '@/locales/groupTrips';

const formatDate = (dateStr) => formatDay(dateStr, { day: 'numeric', month: 'long', year: 'numeric' });

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export default function GroupTripDetail() {
  const { t, rich, locale, langOf, formatKES } = useI18n(messages);
  const { personaLabel, groupLabel } = useVibeWords();
  const { slug } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Sign-in from the join dialog brings the traveller back to this trip.
  const authState = { from: location.pathname };

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // '' | 'missing' | 'failed'
  const [attempt, setAttempt] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    paymentType: 'deposit',
    travelPersonalities: [],
    travelGroup: '',
    selectedAvatar: 'avatar_1.png',
  });
  const [modalStep, setModalStep] = useState('form'); // 'form' | 'vibe' | 'review' | 'submitting' | 'success' | 'error'
  const [modalError, setModalError] = useState('');
  const [bookingData, setBookingData] = useState(null);

  const countdown = useCountdown(trip?.startDate);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    axios.get(`${API_URL}/group-trips/${slug}`)
      .then((res) => alive && setTrip(res.data))
      .catch((err) => alive && setError(isNotFound(err) ? 'missing' : 'failed'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug, attempt]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleVibeComplete = (vibeData) => {
    setFormData(prev => ({ ...prev, ...vibeData }));
    setModalStep('review');
  };

  // Submit a booking REQUEST (no payment). The backend creates a pending
  // booking, emails a quotation to the traveller, and notifies the admin,
  // who confirms it. No M-Pesa here.
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalStep('submitting');

    try {
      const res = await axios.post(`${API_URL}/group-bookings/join`, {
        tripId: trip._id,
        paymentType: formData.paymentType,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        travelPersonalities: formData.travelPersonalities,
        travelGroup: formData.travelGroup,
        selectedAvatar: formData.selectedAvatar,
        // The traveller's language, for their emails and quotation.
        locale,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setBookingData({ ...res.data.booking, emailed: res.data.delivery?.email === true });
      setModalStep('success');
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.error ||
        (Array.isArray(data?.issues) && data.issues.map((i) => i.message).join(', ')) ||
        t('genericError');
      setModalStep('error');
      setModalError(msg);
    }
  };

  const amountNow = formData.paymentType === 'full' ? trip?.fullPrice : trip?.depositAmount;

  if (loading) {
    return (
      <Container size="wide" className="py-16" role="status" aria-label={t('loading')}>
        <SlowNotice className="mb-6" />
        <div className="aspect-[21/9] w-full animate-pulse rounded-[var(--radius-card)] bg-sand-100" />
        <div className="mt-8 h-10 w-2/3 animate-pulse rounded bg-sand-100" />
      </Container>
    );
  }

  if (error === 'failed') {
    return (
      <Container size="narrow" className="py-24">
        <Seo title={t('seoTrip')} noindex />
        <ErrorState what={t('thisTrip')} onRetry={() => setAttempt((n) => n + 1)} />
      </Container>
    );
  }

  if (error || !trip) {
    return (
      <Container size="narrow" className="py-24 text-center">
        <Seo title={t('seoNotFound')} noindex />
        <p className="font-display text-3xl text-ocean-900">{t('notFoundTitle')}</p>
        <p className="mt-3 text-ocean-900/60">{t('notFoundText')}</p>
        <Button to="/group-trips" className="mt-8">{t('seeUpcoming')}</Button>
      </Container>
    );
  }

  const slotsLeft = trip.slotsRemaining ?? (trip.maxParticipants - trip.confirmedParticipants);
  const isFull = trip.status === 'full' || slotsLeft <= 0;
  const isClosed = trip.status === 'closed';
  const slotPercent = Math.min(100, Math.round((trip.confirmedParticipants / trip.maxParticipants) * 100));
  const exp = normaliseGroupTrip(trip);
  const kes = (n) => formatKES(Number(n || 0));
  // The team's Italian text when there is one; the rest of the listing is its own English.
  const title = pickText(trip, 'title', locale);
  const shortDescription = pickText(trip, 'shortDescription', locale);
  const fullDescription = pickText(trip, 'description', locale, trip.fullDescription);
  const contentLang = langOf('en');
  const translated = hasItalianContent(trip);
  const path = `/group-trips/${trip.slug}`;
  const inputCls = 'h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-ocean-900';

  const share = async () => {
    const url = absoluteUrl(localisePath(path, locale));
    try {
      if (navigator.share) await navigator.share({ title: title.text, text: shortDescription.text, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* cancelled */ }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': withRatingType('TouristTrip', exp.rating),
    name: title.text,
    description: shortDescription.text,
    aggregateRating: aggregateRatingLd(exp.rating),
    image: trip.heroImage || undefined,
    url: absoluteUrl(localisePath(path, translated ? locale : 'en')),
    touristType: t('touristType'),
    itinerary: (trip.itinerary || []).map((d) => ({ '@type': 'TouristAttraction', name: t('itineraryDay', { n: d.day, title: d.title }) })),
    offers: { '@type': 'Offer', price: trip.fullPrice, priceCurrency: 'KES', availability: isFull || isClosed ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', validFrom: trip.createdAt },
    provider: { '@type': 'TravelAgency', name: 'Exploring Watamu' },
  };

  const PriceBox = (
    <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft">
      <p className="text-sm text-ocean-900/60">{t('fullPrice')}</p>
      <p className="font-display text-4xl text-ocean-900">{kes(trip.fullPrice)}</p>
      <p className="mt-1 text-sm text-ocean-900/60">{t('orDeposit', { deposit: kes(trip.depositAmount) })}</p>

      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-ocean-900">{t('going', { confirmed: trip.confirmedParticipants, max: trip.maxParticipants })}</span>
          <span className={`font-semibold ${slotsLeft <= 3 ? 'text-coral-600' : 'text-lagoon-700'}`}>{isFull ? t('full') : t('spotsLeft', { count: slotsLeft })}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-200" aria-hidden="true">
          <div className={`h-full rounded-full ${slotsLeft <= 3 ? 'bg-coral-500' : 'bg-lagoon-500'}`} style={{ width: `${slotPercent}%` }} />
        </div>
      </div>

      {isClosed || isFull ? (
        <Button size="lg" className="mt-6 w-full" disabled>{isClosed ? t('closed') : t('fullyBooked')}</Button>
      ) : (
        <Button size="lg" className="mt-6 w-full" onClick={() => { setModalStep('form'); setModalError(''); setModalOpen(true); }}>
          {t('requestToJoin')}
        </Button>
      )}
      {!isClosed && !isFull && (
        <AddToTripButton item={exp} size="md" full className="mt-3" label={t('addToPlan')} />
      )}
      <WhatsAppButton
        full
        className="mt-3"
        message={listingMessage({
          kind: 'group',
          title: title.text,
          details: [`${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`, t('perPerson', { price: kes(trip.fullPrice) })],
          path,
        })}
      >
        {t('askWhatsApp')}
      </WhatsAppButton>
      <ul className="mt-5 space-y-2 text-sm text-ocean-900/65">
        <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-lagoon-600" /> {t('payAfter')}</li>
        <li className="flex gap-2"><Users className="size-4 shrink-0 text-lagoon-600" /> {t('smallGroup')}</li>
        {trip.balanceDueDate && <li className="flex gap-2"><Clock className="size-4 shrink-0 text-lagoon-600" /> {t('balanceDue', { date: formatDate(trip.balanceDueDate) })}</li>}
      </ul>
      <button type="button" onClick={share} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ocean-900/60 hover:text-ocean-900">
        <Share2 className="size-4" /> {t('share')}
      </button>
    </div>
  );

  return (
    <>
      <Seo title={title.text} description={shortDescription.text} image={trip.heroImage} type="article" jsonLd={jsonLd} path={path} translated={translated} />

      {/* Hero */}
      <section className="relative">
        <div className={`relative w-full overflow-hidden bg-ocean-900 ${trip.heroImage ? 'h-[52vh] min-h-80' : 'h-[34vh] min-h-72'}`}>
          {trip.heroImage ? (
            <Photo src={trip.heroImage} sizes="100vw" priority className="size-full object-cover" fallback={<VibeArt vibe={exp.vibes[0]} className="size-full" label={title.text} />} />
          ) : (
            <VibeArt vibe={exp.vibes[0]} className="size-full" label={title.text} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/85 via-ocean-950/30 to-transparent" />
        </div>
        <Container size="wide" className="absolute inset-x-0 bottom-0 pb-10 text-sand-50">
          <Link to="/group-trips" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sand-50/80 hover:text-sand-50">
            <ArrowLeft className="size-4" /> {t('allTrips')}
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge tone="glass"><Users /> {t('groupTrip')}</Badge>
            {isFull && <Badge tone="sand">{t('fullyBooked')}</Badge>}
          </div>
          <h1 lang={langOf(title.lang)} className="mt-3 max-w-4xl font-display text-4xl leading-[1.05] sm:text-6xl">
            {title.text}
          </h1>
          {exp.rating && (
            <a href="#reviews" className="mt-3 inline-block rounded-full bg-white/90 px-3 py-1">
              <RatingBadge stats={exp.rating} />
            </a>
          )}
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sand-50/85">
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-5" /> {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
            {trip.meetingPoint && <span lang={contentLang} className="inline-flex items-center gap-2"><MapPin className="size-5" /> {trip.meetingPoint}</span>}
          </p>
        </Container>
      </section>

      <Container size="wide" className="grid gap-10 py-12 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <div className="min-w-0 space-y-12">
          {!isFull && !isClosed && countdown.days !== undefined && (
            <div className="grid grid-cols-4 gap-3 rounded-[var(--radius-card)] bg-ocean-900 p-5 text-center text-sand-50" aria-label={t('countdown')}>
              {[['days', countdown.days], ['hours', countdown.hours], ['mins', countdown.minutes], ['secs', countdown.seconds]].map(([label, val]) => (
                <div key={label}>
                  <div className="font-display text-4xl tabular-nums">{String(val ?? 0).padStart(2, '0')}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-sand-50/60">{t(label)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="lg:hidden">{PriceBox}</div>

          <section>
            <p className="eyebrow">{t('theTrip')}</p>
            <p lang={langOf(shortDescription.lang)} className="mt-3 font-display text-2xl leading-snug text-ocean-900">
              {shortDescription.text}
            </p>
            {fullDescription.text && (
              <p lang={langOf(fullDescription.lang)} className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ocean-900/75">
                {fullDescription.text}
              </p>
            )}
          </section>

          <ParticipantCarousel tripId={trip._id} />

          {trip.itinerary?.length > 0 && (
            <section>
              <h2 className="font-display text-3xl text-ocean-900">{t('dayByDay')}</h2>
              <ol lang={contentLang} className="mt-6 space-y-0">
                {trip.itinerary.map((day, i) => (
                  <li key={i} className="relative flex gap-5 pb-8 last:pb-0">
                    {i < trip.itinerary.length - 1 && <span className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-sand-300" aria-hidden="true" />}
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ocean-900 font-display text-lg text-sand-50">{day.day}</span>
                    <div className="pt-1.5">
                      <p className="font-display text-xl text-ocean-900">{day.title}</p>
                      {day.activities?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-ocean-900/70">
                          {day.activities.map((a, j) => <li key={j}>{a}</li>)}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(trip.includes?.length > 0 || trip.excludes?.length > 0) && (
            <section lang={contentLang} className="grid gap-6 sm:grid-cols-2">
              {trip.includes?.length > 0 && (
                <div className="rounded-[var(--radius-card)] bg-mangrove-50 p-6">
                  <h3 lang={locale} className="font-display text-xl text-ocean-900">{t('included')}</h3>
                  <ul className="mt-3 space-y-2">
                    {trip.includes.map((x, i) => <li key={i} className="flex gap-2 text-ocean-900/80"><Check className="mt-0.5 size-4 shrink-0 text-mangrove-700" /> {x}</li>)}
                  </ul>
                </div>
              )}
              {trip.excludes?.length > 0 && (
                <div className="rounded-[var(--radius-card)] bg-sand-100 p-6">
                  <h3 lang={locale} className="font-display text-xl text-ocean-900">{t('notIncluded')}</h3>
                  <ul className="mt-3 space-y-2">
                    {trip.excludes.map((x, i) => <li key={i} className="flex gap-2 text-ocean-900/70"><X className="mt-0.5 size-4 shrink-0 text-coral-500" /> {x}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          <div id="reviews" className="scroll-mt-28">
            <ReviewsSection listingType="group" listingId={trip._id} />
          </div>

          {trip.gallery?.length > 0 && (
            <section>
              <h2 className="font-display text-3xl text-ocean-900">{t('gallery')}</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {trip.gallery.map((img, i) => (
                  <Photo key={i} src={img} alt={t('photoN', { title: title.text, n: i + 1 })} sizes="(min-width: 640px) 33vw, 50vw" max={960} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            {PriceBox}
            {user && <ReferralCard />}
          </div>
        </aside>
      </Container>

      {/* Join flow (unchanged logic, new look) */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ocean-950/50 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.5rem] bg-sand-50 p-6 shadow-lift focus:outline-none sm:p-8">
            <Dialog.Description className="sr-only">{t('requestSpot', { title: title.text })}</Dialog.Description>
            {modalStep === 'form' && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <Dialog.Title className="font-display text-2xl text-ocean-900">{t('requestToJoin')}</Dialog.Title>
                  <Dialog.Close aria-label={t('close')} className="rounded-full p-2 text-ocean-900/60 hover:bg-ocean-900/5"><X className="size-5" /></Dialog.Close>
                </div>
                {!user ? (
                  <div className="py-4 text-center">
                    <p className="text-ocean-900/70">{t('signInFirst')}</p>
                    <div className="mt-6 flex justify-center gap-3">
                      <Button to="/login" state={authState} onClick={() => setModalOpen(false)}>{t('signIn')}</Button>
                      <Button to="/register" state={authState} variant="outline" onClick={() => setModalOpen(false)}>{t('createAccount')}</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setModalStep('vibe'); }} className="space-y-4">
                    {modalError && <p className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">{modalError}</p>}
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold">{t('fullName')}</span><input name="fullName" value={formData.fullName} onChange={handleFormChange} required className={inputCls} autoComplete="name" /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold">{t('email')}</span><input type="email" name="email" value={formData.email} onChange={handleFormChange} required className={inputCls} autoComplete="email" /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold">{t('phone')}</span><input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} required placeholder="+254 7XX XXX XXX" className={inputCls} autoComplete="tel" /></label>
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold">{t('howPay')}</legend>
                      <div className="space-y-2">
                        {[['deposit', t('deposit'), t('depositSub', { amount: kes(trip.depositAmount) })], ['full', t('fullAmount'), kes(trip.fullPrice)]].map(([val, label, sub]) => (
                          <label key={val} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${formData.paymentType === val ? 'border-coral-400 bg-white shadow-soft' : 'border-sand-300'}`}>
                            <input type="radio" name="paymentType" value={val} checked={formData.paymentType === val} onChange={handleFormChange} className="accent-coral-500" />
                            <span><span className="block font-semibold text-ocean-900">{label}</span><span className="text-sm text-ocean-900/60">{sub}</span></span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <Button type="submit" size="lg" className="w-full">{t('nextVibe')}</Button>
                  </form>
                )}
              </>
            )}

            {modalStep === 'vibe' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <Dialog.Title className="font-display text-2xl text-ocean-900">{t('tellVibe')}</Dialog.Title>
                  <button type="button" onClick={() => setModalStep('form')} className="rounded-full p-2 text-ocean-900/60 hover:bg-ocean-900/5" aria-label={t('back')}><ArrowLeft className="size-5" /></button>
                </div>
                <TravelVibeSelector onComplete={handleVibeComplete} />
              </div>
            )}

            {modalStep === 'review' && (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="mb-2 flex items-center justify-between">
                  <Dialog.Title className="font-display text-2xl text-ocean-900">{t('review')}</Dialog.Title>
                  <button type="button" onClick={() => setModalStep('vibe')} className="rounded-full p-2 text-ocean-900/60 hover:bg-ocean-900/5" aria-label={t('back')}><ArrowLeft className="size-5" /></button>
                </div>
                {modalError && <p className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">{modalError}</p>}
                <div className="rounded-2xl bg-lagoon-50 p-4 text-sm text-ocean-900">
                  <p className="font-semibold">{t('yourVibe')}</p>
                  <p className="mt-1">{formData.travelPersonalities.map(personaLabel).join(' · ')}</p>
                  <p className="text-ocean-900/65">{t('travellingAs', { group: groupLabel(formData.travelGroup) })}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="flex justify-between"><span>{t('paymentOption')}</span><span className="font-semibold">{formData.paymentType === 'full' ? t('paymentFull') : t('paymentDeposit')}</span></div>
                  <div className="mt-1 flex justify-between"><span>{t('dueOnceConfirmed')}</span><span className="font-semibold">{kes(amountNow)}</span></div>
                </div>
                <p className="text-xs text-ocean-900/60">{t('requestNote')}</p>
                <Button type="submit" size="lg" className="w-full">{t('send')}</Button>
              </form>
            )}

            {modalStep === 'submitting' && (
              <div className="py-12 text-center" role="status">
                <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-sand-300 border-t-coral-500" />
                <Dialog.Title className="mt-4 font-display text-2xl text-ocean-900">{t('sending')}</Dialog.Title>
              </div>
            )}

            {modalStep === 'success' && bookingData && (
              <div className="space-y-6 text-center">
                <Dialog.Title className="font-display text-3xl text-ocean-900">{t('onTheList')}</Dialog.Title>
                <p className="text-ocean-900/70">
                  {rich('pending', { b: (text) => <strong>{text}</strong> })}{' '}
                  {rich(bookingData.emailed ? 'emailed' : 'willContact', { b: (text) => <strong>{text}</strong> }, { email: bookingData.email })}
                </p>
                <ECardPreview booking={bookingData} trip={trip} user={user} />
                <Button size="lg" className="w-full" onClick={() => { setModalOpen(false); navigate('/my-trips'); }}>{t('seeBookings')}</Button>
              </div>
            )}

            {modalStep === 'error' && (
              <div className="py-8 text-center">
                <Dialog.Title className="font-display text-2xl text-ocean-900">{t('wentWrong')}</Dialog.Title>
                <p className="mt-2 text-ocean-900/65">{modalError || t('pleaseTryAgain')}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button onClick={() => { setModalStep('review'); setModalError(''); }}>{t('tryAgain')}</Button>
                  <Button variant="outline" onClick={() => setModalOpen(false)}>{t('close')}</Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
