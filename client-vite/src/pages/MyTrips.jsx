import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays, MapPin, FileText, Users, Luggage, Mail } from 'lucide-react';
import { API_URL } from '@/api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { Container, Badge, SectionHeading } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import Photo from '@/components/ui/Photo';
import { ErrorState, SlowNotice } from '@/components/listing/States';
import { formatKES } from '@/lib/catalog';
import { formatDay } from '@/lib/utils';
import Seo from '@/components/seo/Seo';

const SUPPORT_EMAIL = 'hello@exploringwatamu.com';

// Arrival, departure, trip dates and validity are calendar days; "sent" is a moment in time.
const fmt = (d) => formatDay(d);
const fmtSent = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** The priced quote, line by line — readable here even if the email never arrived. */
function QuoteDetails({ request: r }) {
  const q = r.quote;
  const subject = encodeURIComponent(`My Watamu trip quote ${r.reference}`);
  return (
    <div className="mt-4 rounded-2xl bg-sand-100 p-4">
      <p className="text-sm text-ocean-900/60">Your quote</p>
      <p className="font-display text-3xl text-ocean-900">{formatKES(q.total)}</p>
      {q.validUntil && <p className="text-xs text-ocean-900/60">Valid until {fmt(q.validUntil)}</p>}
      {q.lines?.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <caption className="sr-only">What your quote includes</caption>
          <tbody>
            {q.lines.map((l, i) => (
              <tr key={i} className="border-t border-sand-200">
                <td className="py-2 pr-3 text-ocean-900/80">{l.label}</td>
                <td className="whitespace-nowrap py-2 text-right font-semibold tabular-nums text-ocean-900">{formatKES(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {q.message && <p className="mt-4 whitespace-pre-line text-sm text-ocean-900/75">{q.message}</p>}
      {r.status === 'quoted' && (
        <p className="mt-4 text-sm text-ocean-900/70">
          To go ahead, reply to your quote email or{' '}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`} className="inline-flex items-center gap-1 font-semibold text-lagoon-700 underline">
            <Mail className="size-3.5" /> write to us
          </a>{' '}
          quoting {r.reference}.
        </p>
      )}
    </div>
  );
}

const REQUEST_STATUS = {
  new: { label: 'With our team', tone: 'ochre' },
  quoted: { label: 'Quote sent', tone: 'coral' },
  accepted: { label: 'Confirmed', tone: 'mangrove' },
  declined: { label: 'Declined', tone: 'sand' },
  cancelled: { label: 'Cancelled', tone: 'sand' },
};
const BOOKING_STATUS = {
  pending: { label: 'Pending', tone: 'ochre' },
  confirmed: { label: 'Confirmed', tone: 'mangrove' },
  cancelled: { label: 'Cancelled', tone: 'sand' },
};

function Empty({ icon: Icon, title, text, to, cta }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-white/60 p-8 text-center">
      <Icon className="mx-auto size-8 text-lagoon-600" />
      <p className="mt-3 font-display text-xl text-ocean-900">{title}</p>
      <p className="mt-1 text-sm text-ocean-900/60">{text}</p>
      <Button to={to} className="mt-5" size="sm">
        {cta}
      </Button>
    </div>
  );
}

/** Signed-in traveller's trip requests (quotes) and group-trip bookings. */
export default function MyTrips() {
  const { user, token, loading: authLoading, unreachable, retry: retryAuth } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Signed out → sign in and come back. Server unreachable → offer a retry below instead.
    if (!authLoading && !user && !unreachable) {
      navigate('/login', { state: { from: '/my-trips' } });
      return;
    }
    if (!user || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);
    setError('');
    Promise.allSettled([axios.get(`${API_URL}/trip-requests/mine`, { headers }), axios.get(`${API_URL}/group-bookings/my-bookings`, { headers })])
      .then(([r, b]) => {
        if (r.status === 'fulfilled') setRequests(Array.isArray(r.value.data) ? r.value.data : []);
        if (b.status === 'fulfilled') setBookings(Array.isArray(b.value.data) ? b.value.data : []);
        if (r.status === 'rejected' || b.status === 'rejected') setError('Some of your bookings couldn’t be loaded.');
      })
      .finally(() => setLoading(false));
  }, [user, token, authLoading, unreachable, navigate, attempt]);

  if (authLoading || (user && loading)) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-5" role="status" aria-label="Loading">
        <div className="text-center">
          <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-sand-300 border-t-coral-500" />
          <SlowNotice className="mt-6" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Container size="narrow" className="py-24">
        <Seo title="My bookings" noindex />
        {unreachable ? <ErrorState what="your account" onRetry={retryAuth} /> : null}
      </Container>
    );
  }

  return (
    <Container size="default" className="py-12 lg:py-16">
      <Seo title="My bookings" noindex />
      <p className="eyebrow">Hi {user?.name?.split(' ')[0] || 'there'}</p>
      <h1 className="mt-3 font-display text-4xl text-ocean-900 sm:text-5xl">My bookings</h1>
      {error && (
        <p className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-coral-50 p-4 text-coral-700">
          {error}
          <Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </p>
      )}

      <section className="mt-12">
        <SectionHeading title="Trip quotes" lede="Itineraries you’ve sent from the trip planner." />
        <div className="mt-6 space-y-4">
          {requests.length === 0 ? (
            <Empty icon={Luggage} title="No trip requests yet" text="Plan your days and send them to us for a tailored price." to="/trip" cta="Open the trip planner" />
          ) : (
            requests.map((r) => {
              const s = REQUEST_STATUS[r.status] || REQUEST_STATUS.new;
              return (
                <article key={r.reference} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-lg font-semibold text-ocean-900">{r.reference}</p>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </div>
                  <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ocean-900/60">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" /> {r.arrival ? `${fmt(r.arrival)} – ${fmt(r.departure)}` : `${r.days?.length || 0} days, flexible`}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" /> {r.adults + (r.children || 0)} travellers
                    </span>
                    <span>{r.itemCount} items · sent {fmtSent(r.createdAt)}</span>
                  </p>
                  {r.quote && <QuoteDetails request={r} />}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading title="Group trips" lede="Scheduled adventures you’ve asked to join." />
        <div className="mt-6 space-y-4">
          {bookings.length === 0 ? (
            <Empty icon={Users} title="No group trips yet" text="Join a scheduled adventure and meet other travellers." to="/group-trips" cta="Browse group trips" />
          ) : (
            bookings.map((b) => {
              const trip = b.trip;
              const s = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
              return (
                <article key={b._id} className="flex gap-4 rounded-[var(--radius-card)] border border-sand-200 bg-white p-5 shadow-soft">
                  {trip?.heroImage && <Photo src={trip.heroImage} sizes="80px" max={320} className="size-20 shrink-0 rounded-2xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-display text-xl text-ocean-900">{trip?.title || 'Group trip'}</h3>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                    {trip && (
                      <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-ocean-900/60">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4" /> {fmt(trip.startDate)} – {fmt(trip.endDate)}
                        </span>
                        {trip.meetingPoint && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4" /> {trip.meetingPoint}
                          </span>
                        )}
                      </p>
                    )}
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs text-ocean-900/60">{b.status === 'confirmed' ? 'Amount paid' : 'Due on confirmation'}</dt>
                        <dd className="font-semibold">{formatKES(b.amountPaid)}</dd>
                      </div>
                      {b.amountDue > 0 && (
                        <div>
                          <dt className="text-xs text-ocean-900/60">Balance</dt>
                          <dd className="font-semibold text-coral-600">{formatKES(b.amountDue)}</dd>
                        </div>
                      )}
                      {trip?.balanceDueDate && b.paymentType === 'deposit' && (
                        <div>
                          <dt className="text-xs text-ocean-900/60">Balance due</dt>
                          <dd className="font-semibold">{fmt(trip.balanceDueDate)}</dd>
                        </div>
                      )}
                    </dl>
                    {trip?.slug && (
                      <Link to={`/group-trips/${trip.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-lagoon-700 hover:underline">
                        <FileText className="size-4" /> Trip details
                      </Link>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </Container>
  );
}
