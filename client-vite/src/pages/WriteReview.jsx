import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock, PenLine } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { Container, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { ErrorState, SlowNotice } from '@/components/listing/States';
import ReviewForm from '@/components/reviews/ReviewForm';
import { RatingStars } from '@/components/reviews/Rating';
import Seo from '@/components/seo/Seo';
import { fetchEligible, LISTING_LABEL } from '@/lib/reviews';
import { reviewError } from '@/lib/reviewErrors';
import { formatDay } from '@/lib/utils';
import { useI18n } from '@/i18n';
import messages from '@/locales/reviews';

// [message key, badge tone]
const STATUS_COPY = {
  pending: ['statusPendingThanks', 'ochre'],
  approved: ['statusApproved', 'mangrove'],
  hidden: ['statusHidden', 'sand'],
};

function Item({ item, token, inviteToken, onReviewed }) {
  const { t } = useI18n(messages);
  const [open, setOpen] = useState(false);
  const label = LISTING_LABEL[item.listingType] || t('kind.other');
  const status = item.review ? STATUS_COPY[item.review.status] || STATUS_COPY.pending : null;

  return (
    <article className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ocean-900/60">{label}</p>
          <h2 className="mt-1 font-display text-2xl text-ocean-900">{item.listingTitle}</h2>
        </div>
        {status && <Badge tone={status[1]}>{t(status[0])}</Badge>}
      </div>

      {item.review ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ocean-900/70">
          <CheckCircle2 className="size-4 text-mangrove-700" /> {t('youRated')} <RatingStars value={item.review.rating} />
        </p>
      ) : item.reason === 'not-ended' ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ocean-900/70">
          <CalendarClock className="size-4 text-lagoon-600" /> {t('openFrom', { date: formatDay(item.availableFrom, { day: 'numeric', month: 'long', year: 'numeric' }) })}
        </p>
      ) : item.reason === 'no-dates' ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ocean-900/70">
          <Clock className="size-4 text-lagoon-600" /> {t('noDates')}
        </p>
      ) : open ? (
        <div className="mt-5">
          <ReviewForm item={item} token={token} inviteToken={inviteToken} onDone={(review) => onReviewed(item, review)} />
        </div>
      ) : (
        <Button className="mt-5" onClick={() => setOpen(true)}>
          <PenLine /> {t('write')}
        </Button>
      )}
    </article>
  );
}

/**
 * /review/:bookingType/:bookingId[?t=invitation] — review the listings of one
 * finished booking. Linked from the post-trip email and from My bookings.
 */
export default function WriteReview() {
  const { t, rich } = useI18n(messages);
  const { bookingType, bookingId } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const inviteToken = params.get('t') || undefined;
  const { user, token, loading: authLoading, unreachable, retry } = useAuth();
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user || !token) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetchEligible(token, { bookingType, bookingId, inviteToken })
      .then((items) => alive && setState({ items, loading: false, error: '' }))
      .catch((err) => alive && setState({ items: [], loading: false, error: err?.response?.status === 404 ? 'not-found' : reviewError(err) }));
    return () => {
      alive = false;
    };
  }, [user, token, bookingType, bookingId, inviteToken, attempt]);

  const onReviewed = (item, review) =>
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i === item ? { ...i, canReview: false, reason: 'reviewed', review: { _id: review._id, status: review.status || 'pending', rating: review.rating } } : i)),
    }));

  const here = `${location.pathname}${location.search}`;

  if (authLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center" role="status" aria-label={t('loading')}>
        <span className="size-8 animate-spin rounded-full border-2 border-sand-300 border-t-coral-500" />
      </div>
    );
  }

  return (
    <Container size="narrow" className="py-12 lg:py-16">
      <Seo title={t('seo')} noindex />
      <p className="eyebrow">{t('eyebrow')}</p>
      <h1 className="mt-3 font-display text-4xl text-ocean-900 sm:text-5xl">{t('title')}</h1>
      <p className="mt-3 text-lg text-ocean-900/70">{t('lede')}</p>

      <div className="mt-10 space-y-5">
        {!user ? (
          unreachable ? (
            <ErrorState what={t('yourAccount')} onRetry={retry} />
          ) : (
            <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-8 text-center shadow-soft">
              <p className="font-display text-2xl text-ocean-900">{t('signInTitle')}</p>
              <p className="mt-2 text-ocean-900/65">{inviteToken ? t('signInTextInvite') : t('signInText')}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button to="/login" state={{ from: here }}>{t('signIn')}</Button>
                <Button to="/register" state={{ from: here }} variant="outline">{t('createAccount')}</Button>
              </div>
            </div>
          )
        ) : state.loading ? (
          <div role="status" aria-label={t('loading')} className="space-y-3">
            <SlowNotice />
            <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-sand-100" />
          </div>
        ) : state.error === 'not-found' ? (
          <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-8 text-center">
            <p className="font-display text-2xl text-ocean-900">{t('notFoundTitle')}</p>
            <p className="mx-auto mt-2 max-w-md text-ocean-900/65">{t('notFoundText')}</p>
            <Button to="/my-trips" variant="outline" className="mt-6">{t('myBookings')}</Button>
          </div>
        ) : state.error ? (
          <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-8 text-center">
            <p className="text-ocean-900/75">{state.error}</p>
            <Button variant="outline" className="mt-5" onClick={() => setAttempt((n) => n + 1)}>{t('tryAgain')}</Button>
          </div>
        ) : state.items.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-sand-300 bg-sand-100/60 p-8 text-center">
            <p className="font-display text-2xl text-ocean-900">{t('nothingTitle')}</p>
            <p className="mt-2 text-ocean-900/65">{t('nothingText')}</p>
          </div>
        ) : (
          state.items.map((item) => <Item key={`${item.listingType}:${item.listingId}`} item={item} token={token} inviteToken={inviteToken} onReviewed={onReviewed} />)
        )}
      </div>

      {user && (
        <p className="mt-10 text-center text-sm text-ocean-900/60">
          {rich('seeAll', { link: (text) => <Link to="/my-trips" className="font-semibold underline">{text}</Link> })}
        </p>
      )}
    </Container>
  );
}
