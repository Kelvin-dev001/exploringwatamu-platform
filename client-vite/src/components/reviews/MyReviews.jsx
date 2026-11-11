import { useEffect, useState } from 'react';
import { MessageCircleHeart, PenLine } from 'lucide-react';
import { Badge, SectionHeading } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/reviews/Rating';
import { fetchEligible, fetchMyReviews, LISTING_LABEL, reviewPath } from '@/lib/reviews';

const STATUS = {
  pending: ['Waiting for a quick check', 'ochre'],
  approved: ['Published', 'mangrove'],
  hidden: ['Not published', 'sand'],
};

/** My bookings: trips waiting for a review, and the traveller's reviews with their status. */
export default function MyReviews({ token }) {
  const [state, setState] = useState({ toWrite: [], mine: [], loading: true, error: false });

  useEffect(() => {
    let alive = true;
    Promise.all([fetchEligible(token), fetchMyReviews(token)])
      .then(([eligible, mine]) => alive && setState({ toWrite: eligible.filter((i) => i.canReview), mine, loading: false, error: false }))
      .catch(() => alive && setState({ toWrite: [], mine: [], loading: false, error: true }));
    return () => {
      alive = false;
    };
  }, [token]);

  const { toWrite, mine, loading, error } = state;
  if (loading || error || (!toWrite.length && !mine.length)) return null; // nothing to say yet: no empty section

  return (
    <section className="mt-16">
      <SectionHeading title="Your reviews" lede="Tell other travellers what your trip was like. Our team reads each review before it’s published." />
      {toWrite.length > 0 && (
        <ul className="mt-6 space-y-3">
          {toWrite.map((i) => (
            <li key={`${i.booking.id}:${i.listingType}:${i.listingId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral-200 bg-coral-50/60 p-4">
              <span className="flex items-center gap-3">
                <MessageCircleHeart className="size-5 shrink-0 text-coral-500" />
                <span>
                  <span className="block font-semibold text-ocean-900">{i.listingTitle}</span>
                  <span className="text-xs text-ocean-900/60">
                    {LISTING_LABEL[i.listingType]}
                    {i.booking.reference ? ` · ${i.booking.reference}` : ''}
                  </span>
                </span>
              </span>
              <Button size="sm" to={reviewPath(i.booking)}>
                <PenLine /> Write a review
              </Button>
            </li>
          ))}
        </ul>
      )}
      {mine.length > 0 && (
        <ul className="mt-6 space-y-3">
          {mine.map((r) => {
            const [label, tone] = STATUS[r.status] || STATUS.pending;
            return (
              <li key={r._id} className="rounded-2xl border border-sand-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ocean-900">{r.listingTitle}</span>
                  <Badge tone={tone}>{label}</Badge>
                </div>
                <RatingStars value={r.rating} className="mt-1" />
                <p className="mt-2 line-clamp-2 text-sm text-ocean-900/70">{r.text}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
