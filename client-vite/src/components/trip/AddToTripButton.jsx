import { Check, Plus } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { keyFor } from '@/lib/trip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Add an experience to the trip. Once added it turns into "In your trip",
 * which opens the trip drawer. Safe inside clickable cards (stops the click).
 */
export default function AddToTripButton({ item, snapshot, size = 'sm', className, full = false, label = 'Add to my trip' }) {
  const { has, add, addExperience, openDrawer } = useTrip();
  const key = snapshot ? snapshot.key : keyFor(item.kind, item.id);
  const title = snapshot ? snapshot.title : item.title;
  const inTrip = has(key);
  const disabled = !snapshot && item.kind === 'group' && item.full;

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inTrip) openDrawer();
    else if (snapshot) add(snapshot);
    else addExperience(item);
  };

  return (
    <Button
      size={size}
      variant={inTrip ? 'outline' : 'primary'}
      onClick={onClick}
      disabled={disabled}
      aria-label={inTrip ? `${title} is in your trip. Open trip` : `Add ${title} to my trip`}
      className={cn('relative z-10', full && 'w-full', inTrip && 'border-lagoon-500 text-lagoon-700 hover:bg-lagoon-50', className)}
    >
      {inTrip ? (
        <>
          <Check /> In your trip
        </>
      ) : (
        <>
          <Plus /> {label}
        </>
      )}
    </Button>
  );
}
