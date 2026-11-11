import { useI18n } from '@/i18n';
import messages from '@/locales/groupTrips';

/*
 * The group-trip join flow's travel personalities and groups. Values stay
 * English: they're stored on the booking and shown to other travellers on the
 * trip page. personaLabel / groupLabel say them in the page's language.
 */
export const PERSONALITIES = [
  { label: 'Party Starter', emoji: '🎉' },
  { label: 'Social Butterfly', emoji: '🦋' },
  { label: 'Chill Connector', emoji: '😎' },
  { label: 'Reserved Explorer', emoji: '🌿' },
  { label: 'Music Lover', emoji: '🎧' },
  { label: 'Storyteller', emoji: '📖' },
  { label: 'Jokester', emoji: '😂' },
  { label: 'Deep Talker', emoji: '🎙️' },
  { label: 'Adrenaline Junkie', emoji: '⚡' },
  { label: 'Photography Lover', emoji: '📸' },
  { label: 'Nature Nerd', emoji: '🌴' },
  { label: 'Foodie Explorer', emoji: '🍲' },
  { label: 'Beach Bum', emoji: '🏖️' },
];

export const TRAVEL_GROUPS = [
  { label: 'Solo But Social', emoji: '👤' },
  { label: 'Couple Traveler', emoji: '💑' },
  { label: 'In a Friends Crew', emoji: '👥' },
  { label: 'Digital Nomad', emoji: '💻' },
];

export const personaEmoji = (label) => PERSONALITIES.find((p) => p.label === label)?.emoji || '✨';

/** personaLabel("Beach Bum") → "Vita da spiaggia" on an Italian page; unknown values as stored. */
export function useVibeWords() {
  const { t } = useI18n(messages);
  const say = (prefix, value) => {
    const key = `${prefix}.${value}`;
    const text = t(key);
    return text === key ? value : text;
  };
  return { personaLabel: (p) => say('persona', p), groupLabel: (g) => say('group', g) };
}
