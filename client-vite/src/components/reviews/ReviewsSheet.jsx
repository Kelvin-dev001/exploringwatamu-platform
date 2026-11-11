import { Sheet } from '@/components/ui/sheet';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import { useI18n } from '@/i18n';
import messages from '@/locales/reviews';

/** A listing's reviews in a side panel — for stays, transfers, cars and services, which have no page of their own. */
export default function ReviewsSheet({ open, onOpenChange, listingType, listingId, title }) {
  const { t } = useI18n(messages);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={t('sheetDescription')}>
      <div className="px-6 pb-8">{open && <ReviewsSection listingType={listingType} listingId={listingId} title={t('sheetTitle')} headingLevel="h3" />}</div>
    </Sheet>
  );
}
