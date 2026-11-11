import { AnimatePresence, m } from 'motion/react';
import { ArrowRight, Luggage, Trash2, X, CalendarDays } from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { dayLabel, estimate, snapLength, snapRate, snapTitle, snapTitleLang } from '@/lib/trip';
import { formatKES, getResidency } from '@/lib/catalog';
import { useI18n } from '@/i18n';
import messages from '@/locales/trip';

function Row({ snap, onRemove }) {
  const { t, langOf } = useI18n(messages);
  const title = snapTitle(snap);
  const rate = snapRate(snap);
  const length = snapLength(snap);
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
      <div className="min-w-0 flex-1">
        <p lang={langOf(snapTitleLang(snap))} className="truncate font-semibold text-ocean-900">
          {title}
        </p>
        {(rate || length) && <p className="text-xs text-ocean-900/60">{rate ? t('listed', { rate }) : length}</p>}
      </div>
      <button type="button" onClick={onRemove} aria-label={t('removeItem', { title })} className="rounded-full p-2 text-ocean-900/55 hover:bg-coral-50 hover:text-coral-600">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

/** Quick look at the trip from anywhere; the full planner lives at /trip. */
export default function TripDrawer() {
  const { t } = useI18n(messages);
  const { trip, count, drawerOpen, setDrawerOpen, remove } = useTrip();
  const { total, unpriced } = estimate(trip, getResidency());

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} title={t('drawerTitle')} description={count ? t('items', { count }) : t('nothingYet')}>
      <div className="flex-1 space-y-6 px-6 py-4">
        {count === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand-300 p-6 text-center">
            <Luggage className="mx-auto size-8 text-lagoon-600" />
            <p className="mt-3 font-display text-xl text-ocean-900">{t('emptyTitle')}</p>
            <p className="mt-1 text-sm text-ocean-900/60">{t('emptyText')}</p>
            <Button to="/experiences" className="mt-5" onClick={() => setDrawerOpen(false)}>
              {t('browse')}
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
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ocean-900/60">{t('notScheduled')}</p>
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
            <span className="text-sm text-ocean-900/60">{t('estimateFor', { count: trip.adults + trip.children })}</span>
            <span className="font-display text-2xl text-ocean-900">{formatKES(total)}</span>
          </div>
          {unpriced > 0 && <p className="text-xs text-ocean-900/60">{t('pricedInQuote', { count: unpriced })}</p>}
          <Button to="/trip" className="w-full" size="lg" onClick={() => setDrawerOpen(false)}>
            {t('planDays')} <ArrowRight />
          </Button>
        </div>
      )}
    </Sheet>
  );
}

/** "Added to your trip" confirmation, bottom of the screen. */
export function TripToast() {
  const { t } = useI18n(messages);
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
              {t('viewTrip')}
            </button>
            <button type="button" onClick={dismissToast} aria-label={t('dismiss')} className="shrink-0 rounded-full p-1.5 text-sand-50/60 hover:text-sand-50">
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
  // The label needs room: from 1280px for "My trip", 1536px for longer ones ("Il mio viaggio").
  const { t, locale } = useI18n(messages);
  const roomy = locale === 'en';
  const { count, openDrawer } = useTrip();
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={t('myTripCount', { count })}
      className={`relative inline-flex h-11 items-center gap-2 rounded-full px-3 font-semibold text-ocean-900 transition hover:bg-ocean-900/[0.06] ${className || ''}`}
    >
      <Luggage className="size-5" />
      <span className={roomy ? 'hidden whitespace-nowrap xl:inline' : 'hidden whitespace-nowrap 2xl:inline'}>{t('myTrip')}</span>
      {count > 0 && (
        <m.span
          key={count}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          className={`absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-coral-500 text-[0.7rem] font-bold text-white ${roomy ? 'xl:static' : '2xl:static'}`}
        >
          {count}
        </m.span>
      )}
    </button>
  );
}

