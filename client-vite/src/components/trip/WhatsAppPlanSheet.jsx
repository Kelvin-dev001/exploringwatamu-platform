import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/contact/WhatsApp';
import { businessLink, fitsInLink, tripMessage } from '@/lib/whatsapp';
import { useI18n } from '@/i18n';
import messages from '@/locales/planner';

/** The message itself. Mounted each time the sheet opens, so it starts from the current plan. */
function Message({ trip }) {
  const { t } = useI18n(messages);
  const original = tripMessage(trip);
  const [text, setText] = useState(original);
  const tooLong = !fitsInLink(text);
  const empty = !text.trim();
  const href = !tooLong && !empty ? businessLink(text) : null;

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-2">
      <div>
        {/* The reset button sits beside the label, not inside it: a button inside a <label> takes the label away from the textarea. */}
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="wa-plan-message" className="text-sm font-semibold text-ocean-900">
            {t('waMessage')}
          </label>
          {text !== original && (
            <button type="button" onClick={() => setText(original)} className="inline-flex items-center gap-1 text-xs font-semibold text-ocean-900/60 hover:text-ocean-900">
              <RotateCcw className="size-3.5" /> {t('waStartAgain')}
            </button>
          )}
        </div>
        <textarea
          id="wa-plan-message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          aria-describedby="wa-plan-help"
          className="w-full rounded-2xl border border-sand-300 bg-white p-4 text-sm leading-relaxed text-ocean-900"
        />
      </div>
      {tooLong && (
        <p role="alert" className="rounded-xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">
          {t('waTooLong')}
        </p>
      )}
      <p id="wa-plan-help" className="text-sm text-ocean-900/65">
        {t('waHelp')}
      </p>
      {href ? (
        <Button href={href} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="lg" className="w-full">
          <WhatsAppIcon /> {t('waOpen')}
        </Button>
      ) : (
        <Button variant="whatsapp" size="lg" className="w-full" disabled>
          <WhatsAppIcon /> {t('waOpen')}
        </Button>
      )}
    </div>
  );
}

/** Review the plan as a WhatsApp message, then open WhatsApp with it. */
export default function WhatsAppPlanSheet({ open, onOpenChange }) {
  const { t } = useI18n(messages);
  const { trip } = useTrip();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('waTitle')} description={t('waDescription')}>
      {open && <Message trip={trip} />}
    </Sheet>
  );
}
