import { AnimatePresence, m } from 'motion/react';
import { ArrowRight, Luggage, Trash2, X, CalendarDays } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { dayLabel, estimate } from '@/lib/trip';
import { formatKES, getResidency } from '@/lib/catalog';

function Row({ snap, onRemove }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ocean-900">{snap.title}</p>
        {(snap.rateLabel || snap.lengthLabel) && <p className="text-xs text-ocean-900/60">{snap.rateLabel ? `Listed ${snap.rateLabel}` : snap.lengthLabel}</p>}
      </div>
      <button type="button" onClick={onRemove} aria-label={`Remove ${snap.title}`} className="rounded-full p-2 text-ocean-900/55 hover:bg-coral-50 hover:text-coral-600">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

/** Quick look at the trip from anywhere; the full planner lives at /trip. */
export default function TripDrawer() {
  const { trip, count, drawerOpen, setDrawerOpen, remove } = useTrip();
  const { total, unpriced } = estimate(trip, getResidency());

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} title="My Watamu trip" description={count ? `${count} item${count === 1 ? '' : 's'}` : 'Nothing added yet'}>
      <div className="flex-1 space-y-6 px-6 py-4">
        {count === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand-300 p-6 text-center">
            <Luggage className="mx-auto size-8 text-lagoon-600" />
            <p className="mt-3 font-display text-xl text-ocean-900">Your trip is empty</p>
            <p className="mt-1 text-sm text-ocean-900/60">Add experiences and we’ll help you fit them into your days.</p>
            <Button to="/experiences" className="mt-5" onClick={() => setDrawerOpen(false)}>
              Browse experiences
            </Button>
          </div>
        ) : (
          <>
            {trip.days.map((d, i) =>
              d.items.length ? (
                <div key={i}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-ocean-900/60">
                    <CalendarDays className="size-3.5" /> {dayLabel(trip, i)}
                  </p>
                  <ul className="space-y-2">
                    {d.items.map((k) => trip.items[k] && <Row key={k} snap={trip.items[k]} onRemove={() => remove(k)} />)}
                  </ul>
                </div>
              ) : null
            )}
            {trip.ideas.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ocean-900/60">Not scheduled · stays & extras</p>
                <ul className="space-y-2">
                  {trip.ideas.map((k) => trip.items[k] && <Row key={k} snap={trip.items[k]} onRemove={() => remove(k)} />)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
      {count > 0 && (
        <div className="sticky bottom-0 space-y-3 border-t border-sand-200 bg-sand-50 px-6 py-5">
          <div className="flex items-end justify-between">
            <span className="text-sm text-ocean-900/60">
              Estimate for {trip.adults + trip.children} {trip.adults + trip.children === 1 ? 'person' : 'people'}
            </span>
            <span className="font-display text-2xl text-ocean-900">{formatKES(total)}</span>
          </div>
          {unpriced > 0 && <p className="text-xs text-ocean-900/60">+ {unpriced} item{unpriced === 1 ? '' : 's'} priced in your quote</p>}
          <Button to="/trip" className="w-full" size="lg" onClick={() => setDrawerOpen(false)}>
            Plan my days <ArrowRight />
          </Button>
        </div>
      )}
    </Sheet>
  );
}

/** "Added to your trip" confirmation, bottom of the screen. */
export function TripToast() {
  const { toast, dismissToast, openDrawer } = useTrip();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[55] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <m.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-ocean-900 py-2 pl-5 pr-2 text-sm text-sand-50 shadow-lift"
          >
            <span className="truncate">{toast.message}</span>
            <button type="button" onClick={() => { dismissToast(); openDrawer(); }} className="shrink-0 rounded-full bg-coral-500 px-4 py-1.5 font-semibold hover:bg-coral-600">
              View trip
            </button>
            <button type="button" onClick={dismissToast} aria-label="Dismiss" className="shrink-0 rounded-full p-1.5 text-sand-50/60 hover:text-sand-50">
              <X className="size-4" />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Header button with a live count. */
export function TripButton({ className }) {
  const { count, openDrawer } = useTrip();
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`My trip, ${count} item${count === 1 ? '' : 's'}`}
      className={`relative inline-flex h-11 items-center gap-2 rounded-full px-3 font-semibold text-ocean-900 transition hover:bg-ocean-900/[0.06] ${className || ''}`}
    >
      <Luggage className="size-5" />
      <span className="hidden xl:inline">My trip</span>
      {count > 0 && (
        <m.span
          key={count}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-coral-500 text-[0.7rem] font-bold text-white xl:static"
        >
          {count}
        </m.span>
      )}
    </button>
  );
}

