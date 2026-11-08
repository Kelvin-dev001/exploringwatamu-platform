import { Check, Plus } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { keyFor } from '@/lib/trip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Add an experience to the trip. Once added it turns into "In your trip",
 * which opens the trip drawer. Safe inside clickable cards (stops the click).
 */
export default function AddToTripButton({ item, size = 'sm', className, full = false }) {
  const { has, addExperience, openDrawer } = useTrip();
  const inTrip = has(keyFor(item.kind, item.id));
  const disabled = item.kind === 'group' && item.full;

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inTrip) openDrawer();
    else addExperience(item);
  };

  return (
    <Button
      size={size}
      variant={inTrip ? 'outline' : 'primary'}
      onClick={onClick}
      disabled={disabled}
      aria-label={inTrip ? `${item.title} is in your trip. Open trip` : `Add ${item.title} to my trip`}
      className={cn('relative z-10', full && 'w-full', inTrip && 'border-lagoon-500 text-lagoon-700 hover:bg-lagoon-50', className)}
    >
      {inTrip ? (
        <>
          <Check /> In your trip
        </>
      ) : (
        <>
          <Plus /> Add to my trip
        </>
      )}
    </Button>
  );
}
