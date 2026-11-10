import { Fish, Sunset, Compass, Landmark, Heart, Music, Users, User, Baby, UsersRound } from 'lucide-react';

/*
 * The personalisation vocabulary. Listings get tagged with these same ids in
 * Phase 2, so matching is a simple overlap score. `legacy` maps to the travel
 * personalities the group-trip join flow already collects, so both speak the
 * same language.
 */
export const VIBES = [
  {
    id: 'ocean',
    label: 'Ocean & Reef',
    blurb: 'Snorkelling, sandbanks, dhow trips and turtles.',
    phrase: 'turquoise reefs',
    icon: Fish,
    legacy: ['Beach Bum', 'Nature Nerd'],
  },
  {
    id: 'slow',
    label: 'Slow & Soulful',
    blurb: 'Long breakfasts, yoga, hammocks and quiet beaches.',
    phrase: 'slow mornings',
    icon: Sunset,
    legacy: ['Chill Connector', 'Reserved Explorer'],
  },
  {
    id: 'adventure',
    label: 'Adventure',
    blurb: 'Kitesurfing, deep-sea fishing, forest trails.',
    phrase: 'wild days out',
    icon: Compass,
    legacy: ['Adrenaline Junkie'],
  },
  {
    id: 'culture',
    label: 'Culture & History',
    blurb: 'Ancient ruins, Swahili food and local stories.',
    phrase: 'old stories',
    icon: Landmark,
    legacy: ['Storyteller', 'Foodie Explorer', 'Photography Lover'],
  },
  {
    id: 'romance',
    label: 'Romance',
    blurb: 'Sunset dhows, candlelit dinners, hidden coves.',
    phrase: 'sunsets',
    icon: Heart,
    legacy: ['Deep Talker'],
  },
  {
    id: 'social',
    label: 'Social & Nightlife',
    blurb: 'Group trips, beach parties and new friends.',
    phrase: 'good company',
    icon: Music,
    legacy: ['Party Starter', 'Social Butterfly', 'Music Lover', 'Jokester'],
  },
];

export const MAX_VIBES = 3;

export const COMPANIONS = [
  { id: 'solo', label: 'Just me', blurb: 'Solo, but open to company', phrase: 'just for you', icon: User, legacy: 'Solo But Social' },
  { id: 'couple', label: 'Two of us', blurb: 'Partner or a close friend', phrase: 'for two', icon: Heart, legacy: 'Couple Traveler' },
  { id: 'friends', label: 'Friends', blurb: 'A crew of three or more', phrase: 'with your crew', icon: UsersRound, legacy: 'In a Friends Crew' },
  { id: 'family', label: 'Family', blurb: 'Kids or grandparents along', phrase: 'for the whole family', icon: Baby, legacy: null },
];

export const STAYS = [
  { id: 'weekend', label: 'A weekend', blurb: '1–2 days', days: 2, phrase: 'A weekend' },
  { id: 'short', label: 'A few days', blurb: '3–4 days', days: 4, phrase: 'A few days' },
  { id: 'week', label: 'About a week', blurb: '5–7 days', days: 7, phrase: 'A week' },
  { id: 'long', label: 'Longer', blurb: '8 days or more', days: 10, phrase: 'Weeks' },
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
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Personal headline for the hero, e.g.
 * "A few days of turquoise reefs and sunsets, for two."
 * Returns null without a profile so callers fall back to the default hero.
 */
export function personalHeadline(profile) {
  if (!profile?.vibes?.length) return null;
  const stay = byId(STAYS, profile.stay)?.phrase || 'Days';
  const vibes = joinNatural(profile.vibes.map((id) => byId(VIBES, id)?.phrase).filter(Boolean));
  const who = byId(COMPANIONS, profile.companions)?.phrase;
  return `${stay} of ${vibes}${who ? `, ${who}` : ''}.`;
}

/** Short summary for the header pill, e.g. "Ocean · Two of us · 3–4 days". */
export function profileSummary(profile) {
  if (!profile?.vibes?.length) return null;
  const vibe = byId(VIBES, profile.vibes[0])?.label.split(' ')[0];
  const extra = profile.vibes.length > 1 ? ` +${profile.vibes.length - 1}` : '';
  const who = byId(COMPANIONS, profile.companions)?.label;
  const stay = byId(STAYS, profile.stay)?.blurb;
  return [vibe + extra, who, stay].filter(Boolean).join(' · ');
}
