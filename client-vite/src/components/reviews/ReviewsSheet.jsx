import { Sheet } from '@/components/ui/sheet';
import ReviewsSection from '@/components/reviews/ReviewsSection';

/** A listing's reviews in a side panel — for stays, transfers, cars and services, which have no page of their own. */
export default function ReviewsSheet({ open, onOpenChange, listingType, listingId, title }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description="Reviews from travellers who booked with us">
      <div className="px-6 pb-8">{open && <ReviewsSection listingType={listingType} listingId={listingId} title="Reviews" headingLevel="h3" />}</div>
    </Sheet>
  );
}
