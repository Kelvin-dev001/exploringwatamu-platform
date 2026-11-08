import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { safeStorage } from '@/lib/utils';

/*
 * Visitor personalisation profile.
 *
 * Stored in the browser so it survives reloads and return visits. Shape:
 *   { version: 1, status: 'set' | 'skipped', profile: { vibes, companions, stay } | null, updatedAt }
 *
 * The full-screen question appears for first-time visitors only (no stored
 * record), and never again unless they open it from the profile pill.
 * Phase 4 will also attach the profile to quote requests / the user account.
 */
const STORAGE_KEY = 'ew.vibeProfile.v1';

const VibeProfileContext = createContext(null);

export function VibeProfileProvider({ children, initialRecord }) {
  // `initialRecord` lets previews/tests start in a known state.
  const [record, setRecord] = useState(() => initialRecord ?? safeStorage.get(STORAGE_KEY));
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (record) safeStorage.set(STORAGE_KEY, record);
  }, [record]);

  const saveProfile = useCallback((profile) => {
    setRecord({ version: 1, status: 'set', profile, updatedAt: new Date().toISOString() });
    setOnboardingOpen(false);
  }, []);

  /** "Just let me browse": remember the choice so we never ask again. */
  const skip = useCallback(() => {
    setRecord((prev) => prev ?? { version: 1, status: 'skipped', profile: null, updatedAt: new Date().toISOString() });
    setOnboardingOpen(false);
  }, []);

  const clearProfile = useCallback(() => {
    setRecord({ version: 1, status: 'skipped', profile: null, updatedAt: new Date().toISOString() });
    setOnboardingOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      profile: record?.profile ?? null,
      isFirstVisit: !record,
      onboardingOpen,
      openOnboarding: () => setOnboardingOpen(true),
      saveProfile,
      skip,
      clearProfile,
    }),
    [record, onboardingOpen, saveProfile, skip, clearProfile]
  );

  return <VibeProfileContext.Provider value={value}>{children}</VibeProfileContext.Provider>;
}

export function useVibeProfile() {
  const ctx = useContext(VibeProfileContext);
  if (!ctx) throw new Error('useVibeProfile must be used inside <VibeProfileProvider>');
  return ctx;
}

/**
 * Call on landing pages that should greet first-time visitors (the homepage).
 * Deep links — a shared group trip, a reset-password email — are not interrupted.
 */
export function useFirstVisitPrompt(delayMs = 600) {
  const { isFirstVisit, openOnboarding } = useVibeProfile();
  useEffect(() => {
    if (!isFirstVisit) return undefined;
    const t = setTimeout(openOnboarding, delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstVisit]);
}
