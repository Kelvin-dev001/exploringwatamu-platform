import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAverage, ratingOf, reviewsLabel, starFill } from '@/lib/reviews';
import { useI18n } from '@/i18n';
import messages from '@/locales/ratings';

/** Five stars for a rating (to the nearest half star), labelled for screen readers. */
export function RatingStars({ value, className, starClassName }) {
  const { t } = useI18n(messages);
  return (
    <span role="img" aria-label={t('rated', { average: formatAverage(value) })} className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = starFill(value, n);
        return (
          <span key={n} className="relative inline-flex" data-fill={fill}>
            <Star aria-hidden="true" className={cn('size-4 fill-sand-200 text-sand-300', starClassName)} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star aria-hidden="true" className={cn('size-4 fill-ochre-500 text-ochre-500', starClassName)} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * "★ 4.8 · 12 reviews" for cards and headers. Nothing without approved
 * reviews. Pass onClick to make it open the reviews.
 */
export function RatingBadge({ stats, onClick, className }) {
  const { t } = useI18n(messages);
  const r = ratingOf(stats);
  if (!r) return null;
  const content = (
    <>
      <Star aria-hidden="true" className="size-4 fill-ochre-500 text-ochre-500" />
      <span className="font-semibold text-ocean-900">{formatAverage(r.average)}</span>
      <span className="text-ocean-900/60">· {reviewsLabel(r.count)}</span>
    </>
  );
  const cls = cn('inline-flex items-center gap-1 text-sm', className);
  if (!onClick) {
    return (
      <span className={cls} aria-label={t('ratedFrom', { average: formatAverage(r.average), reviews: reviewsLabel(r.count) })}>
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={t('ratedOpen', { average: formatAverage(r.average), reviews: reviewsLabel(r.count) })}
      className={cn(cls, 'relative z-10 rounded-full underline decoration-sand-300 underline-offset-4 hover:decoration-ocean-900')}
    >
      {content}
    </button>
  );
}
