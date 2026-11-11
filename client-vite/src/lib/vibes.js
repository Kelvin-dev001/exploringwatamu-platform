import { Fish, Sunset, Compass, Landmark, Heart, Music, User, Baby, UsersRound } from 'lucide-react';
import { translator } from '@/i18n';
import messages from '@/locales/vibes';

/*
 * The personalisation vocabulary. Listings get tagged with these same ids in
 * Phase 2, so matching is a simple overlap score. `legacy` maps to the travel
 * personalities the group-trip join flow already collects, so both speak the
 * same language.
 */
// Words come from locales/vibes.js in the current language (getters, so
// they follow a language switch); ids, icons and legacy names never change.
const t = translator(messages);
const worded = (id, fields, extra) => {
  const entry = { id, ...extra };
  fields.forEach((field) => Object.defineProperty(entry, field, { enumerable: true, get: () => t(`${id}.${field}`) }));
  return entry;
};
const VIBE_WORDS = ['label', 'short', 'blurb', 'phrase'];
const WORDS = ['label', 'blurb', 'phrase'];

export const VIBES = [
  worded('ocean', VIBE_WORDS, { icon: Fish, legacy: ['Beach Bum', 'Nature Nerd'] }),
  worded('slow', VIBE_WORDS, { icon: Sunset, legacy: ['Chill Connector', 'Reserved Explorer'] }),
  worded('adventure', VIBE_WORDS, { icon: Compass, legacy: ['Adrenaline Junkie'] }),
  worded('culture', VIBE_WORDS, { icon: Landmark, legacy: ['Storyteller', 'Foodie Explorer', 'Photography Lover'] }),
  worded('romance', VIBE_WORDS, { icon: Heart, legacy: ['Deep Talker'] }),
  worded('social', VIBE_WORDS, { icon: Music, legacy: ['Party Starter', 'Social Butterfly', 'Music Lover', 'Jokester'] }),
];

export const MAX_VIBES = 3;

export const COMPANIONS = [
  worded('solo', WORDS, { icon: User, legacy: 'Solo But Social' }),
  worded('couple', WORDS, { icon: Heart, legacy: 'Couple Traveler' }),
  worded('friends', WORDS, { icon: UsersRound, legacy: 'In a Friends Crew' }),
  worded('family', WORDS, { icon: Baby, legacy: null }),
];

export const STAYS = [
  worded('weekend', WORDS, { days: 2 }),
  worded('short', WORDS, { days: 4 }),
  worded('week', WORDS, { days: 7 }),
  worded('long', WORDS, { days: 10 }),
];

export const byId = (list, id) => list.find((x) => x.id === id);

/**
 * A profile read back from storage, keeping only ids this version knows. A
 * renamed or retired vibe must never break matching, block the onboarding
 * (it would count towards MAX_VIBES with no tile to untick) or be sent to the
 * quote API, which rejects unknown vibes. Null when no vibe survives.
 */
export function normalizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const vibes = Array.isArray(profile.vibes) ? [...new Set(profile.vibes)].filter((id) => byId(VIBES, id)).slice(0, MAX_VIBES) : [];
  if (!vibes.length) return null;
  return {
    vibes,
    companions: byId(COMPANIONS, profile.companions) ? profile.companions : null,
    stay: byId(STAYS, profile.stay) ? profile.stay : null,
  };
}

/**
 * The stored personalisation record ({ version, status, profile }), cleaned up.
 * Anything unreadable, or a saved profile none of whose vibes this version
 * still knows, counts as a first visit — so we simply ask again.
 */
export function readProfileRecord(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 1) return null;
  if (raw.status === 'skipped') return { ...raw, profile: null };
  const profile = normalizeProfile(raw.profile);
  return profile ? { ...raw, status: 'set', profile } : null;
}

function joinNatural(parts) {
  if (parts.length <= 1) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} ${t('and')} ${parts[parts.length - 1]}`;
}

/**
 * Personal headline for the hero, e.g.
 * "A few days of turquoise reefs and sunsets, for two."
 * Returns null without a profile so callers fall back to the default hero.
 */
export function personalHeadline(profile) {
  if (!profile?.vibes?.length) return null;
  const stay = byId(STAYS, profile.stay)?.phrase || t('headlineDays');
  const vibes = joinNatural(profile.vibes.map((id) => byId(VIBES, id)?.phrase).filter(Boolean));
  const who = byId(COMPANIONS, profile.companions)?.phrase;
  return t('headline', { stay, vibes, who: who ? t('headlineWho', { who }) : '' });
}

/** Short summary for the header pill, e.g. "Ocean · Two of us · 3–4 days". */
export function profileSummary(profile) {
  if (!profile?.vibes?.length) return null;
  const vibe = byId(VIBES, profile.vibes[0])?.short;
  const extra = profile.vibes.length > 1 ? ` +${profile.vibes.length - 1}` : '';
  const who = byId(COMPANIONS, profile.companions)?.label;
  const stay = byId(STAYS, profile.stay)?.blurb;
  return [vibe + extra, who, stay].filter(Boolean).join(' · ');
}
