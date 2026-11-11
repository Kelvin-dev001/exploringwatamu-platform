import { useEffect, useState } from 'react';
import { BadgeCheck, MessageSquareQuote, MessageCircleHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Photo from '@/components/ui/Photo';
import { RatingStars } from '@/components/reviews/Rating';
import { fetchListingReviews, formatAverage, LISTING_LABEL, reviewsLabel } from '@/lib/reviews';
import { cn } from '@/lib/utils';

const monthYear = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '');
const PAGE = 5;

function ReviewItem({ review }) {
  return (
    <li className="rounded-2xl border border-sand-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-ocean-900">{review.displayName}</p>
          <p className="text-xs text-ocean-900/60">{monthYear(review.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <RatingStars value={review.rating} />
          {review.verified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-mangrove-700">
              <BadgeCheck className="size-3.5" /> Verified trip
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-ocean-900/80">{review.text}</p>
      {review.photos?.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {review.photos.map((src, i) => (
            <li key={src}>
              <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1} from ${review.displayName}`}>
                <Photo src={src} sizes="96px" max={320} alt="" className="size-24 rounded-xl object-cover" fallback={<span className="block size-24 rounded-xl bg-sand-100" />} />
              </a>
            </li>
          ))}
        </ul>
      )}
      {review.reply?.text && (
        <div className="mt-4 rounded-xl bg-sand-100 p-4 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-ocean-900">
            <MessageSquareQuote className="size-4 text-lagoon-600" /> Reply from Exploring Watamu
          </p>
          <p className="mt-1 whitespace-pre-line text-ocean-900/75">{review.reply.text}</p>
        </div>
      )}
    </li>
  );
}

/**
 * A listing's approved reviews: summary, then five at a time with "Show more".
 * Handles loading, errors (with retry) and the no-reviews state.
 */
export default function ReviewsSection({ listingType, listingId, title = 'What travellers say', className, headingLevel: H = 'h2' }) {
  const [state, setState] = useState({ items: [], page: 0, totalPages: 0, total: 0, summary: null, loading: true, error: false });
  const [attempt, setAttempt] = useState(0);

  const load = async (page, replace) => {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const res = await fetchListingReviews({ listingType, listingId, page, limit: PAGE });
      setState((s) => ({ items: replace ? res.data : [...s.items, ...res.data], page: res.page, totalPages: res.totalPages, total: res.total, summary: res.summary, loading: false, error: false }));
    } catch {
      setState((s) => ({ ...s, loading: false, error: true }));
    }
  };

  useEffect(() => {
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingType, listingId, attempt]);

  const { items, total, summary, loading, error, page, totalPages } = state;
  const first = loading && items.length === 0;

  return (
    <section className={cn('space-y-5', className)} aria-labelledby={`reviews-${listingId}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <H id={`reviews-${listingId}`} className="font-display text-2xl text-ocean-900">
          {title}
        </H>
        {summary?.count > 0 && (
          <p className="flex items-center gap-2 text-sm text-ocean-900/70">
            <RatingStars value={summary.average} />
            <span className="font-semibold text-ocean-900">{formatAverage(summary.average)}</span> · {reviewsLabel(summary.count)}
          </p>
        )}
      </div>

      {first ? (
        <div role="status" aria-label="Loading reviews" className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand-100" />
          ))}
        </div>
      ) : error && items.length === 0 ? (
        <div className="rounded-2xl border border-sand-200 bg-white p-6 text-center">
          <p className="text-ocean-900/70">We couldn’t load the reviews just now.</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-100/60 p-6 text-center">
          <MessageCircleHeart className="mx-auto size-8 text-lagoon-600" />
          <p className="mt-3 font-display text-xl text-ocean-900">No reviews yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ocean-900/65">
            Reviews come only from travellers who did this {LISTING_LABEL[listingType] || 'trip'} with us, after their trip. Be the first — we’ll invite you once you’re home.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((r) => (
              <ReviewItem key={r._id} review={r} />
            ))}
          </ul>
          {error && <p className="text-sm text-coral-700">We couldn’t load more reviews. Try again.</p>}
          {page < totalPages && (
            <Button variant="outline" size="sm" onClick={() => load(page + 1, false)} disabled={loading}>
              {loading ? 'Loading…' : `Show more reviews (${total - items.length} more)`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
