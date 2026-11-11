import { Check, Plus } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { keyFor, snapTitle } from '@/lib/trip';
import { useI18n } from '@/i18n';
import messages from '@/locales/trip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Add an experience to the trip. Once added it turns into "In your trip",
 * which opens the trip drawer. Safe inside clickable cards (stops the click).
 */
export default function AddToTripButton({ item, snapshot, size = 'sm', className, full = false, label }) {
  const { t } = useI18n(messages);
  const { has, add, addExperience, openDrawer } = useTrip();
  const key = snapshot ? snapshot.key : keyFor(item.kind, item.id);
  const title = snapshot ? snapTitle(snapshot) : item.title;
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
      aria-label={inTrip ? t('inTripLabel', { title }) : t('addLabel', { title })}
      className={cn('relative z-10', full && 'w-full', inTrip && 'border-lagoon-500 text-lagoon-700 hover:bg-lagoon-50', className)}
    >
      {inTrip ? (
        <>
          <Check /> {t('inTrip')}
        </>
      ) : (
        <>
          <Plus /> {label ?? t('addToTrip')}
        </>
      )}
    </Button>
  );
}
