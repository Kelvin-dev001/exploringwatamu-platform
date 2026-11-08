import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { safeStorage } from '@/lib/utils';
import { useVibeProfile } from '@/context/VibeProfileContext';
import * as T from '@/lib/trip';

/*
 * The visitor's trip, kept in the browser so it survives reloads and return
 * visits. Phase 4 sends it to the API as a quote request.
 */
const STORAGE_KEY = 'ew.trip.v1';
const TripContext = createContext(null);

export function TripProvider({ children, initialTrip }) {
  const { profile } = useVibeProfile();
  const [trip, setTrip] = useState(() => initialTrip ?? safeStorage.get(STORAGE_KEY) ?? T.emptyTrip(profile));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    safeStorage.set(STORAGE_KEY, trip);
  }, [trip]);

  // An untouched trip follows the visitor's stay length when they set or change it.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setTrip((t) => (T.itemCount(t) === 0 && !t.arrival ? T.emptyTrip(profile) : t));
  }, [profile]);

  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast({ message, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const add = useCallback(
    (snapshot, to = 'auto') => {
      setTrip((t) => T.addItem(t, snapshot, to));
      notify(`Added “${snapshot.title}” to your trip`);
    },
    [notify]
  );

  const value = useMemo(
    () => ({
      trip,
      count: T.itemCount(trip),
      has: (key) => T.hasItem(trip, key),
      add,
      addExperience: (exp, to) => add(T.toSnapshot(exp), to),
      remove: (key) => setTrip((t) => T.removeItem(t, key)),
      move: (key, lane, index) => setTrip((t) => T.moveItem(t, key, lane, index)),
      setDates: (arrival, departure) => setTrip((t) => T.setDates(t, arrival, departure)),
      setDayCount: (n) => setTrip((t) => T.setDayCount(t, n)),
      setTravellers: (adults, children) =>
        setTrip((t) => ({ ...t, adults: Math.max(1, Math.min(30, adults)), children: Math.max(0, Math.min(30, children)) })),
      setNotes: (notes) => setTrip((t) => ({ ...t, notes })),
      addTransfers: () => setTrip((t) => T.addTransfers(t)),
      autoPlan: (ranked) => setTrip((t) => T.autoPlan(t, ranked)),
      replace: (next) => setTrip(next),
      clear: () => setTrip(T.emptyTrip(profile)),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      setDrawerOpen,
      toast,
      dismissToast: () => setToast(null),
    }),
    [trip, add, drawerOpen, toast, profile]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside <TripProvider>');
  return ctx;
}
