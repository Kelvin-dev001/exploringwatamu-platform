import { VIBES, COMPANIONS, byId } from '@/lib/vibes';
import { translator } from '@/i18n';
import messages from '@/locales/cards';

const t = translator(messages);

/*
 * Personal matching: a transparent overlap score, no AI.
 *
 *   +3 for each of the visitor's vibes the listing is tagged with
 *   +2 if the listing suits who they're travelling with
 *   +1 social fit: group trips for solo travellers and friends
 *   -2 a multi-day trip for someone here only a weekend
 *
 * "Great match" = at least one shared vibe and no mismatch on who it suits.
 * Untagged listings score 0 and simply sort after tagged ones.
 */

const SUITS_LABEL = { solo: 'suitsSolo', couple: 'suitsCouple', friends: 'suitsFriends', family: 'suitsFamily' };

export function scoreExperience(item, profile) {
  if (!profile?.vibes?.length) return { score: 0, great: false, reasons: [] };

  const reasons = [];
  let score = 0;

  const shared = item.vibes.filter((v) => profile.vibes.includes(v));
  score += shared.length * 3;
  shared.forEach((v) => reasons.push(byId(VIBES, v)?.label));

  const who = profile.companions;
  const suitsKnown = item.suits.length > 0;
  const suitsWho = who && item.suits.includes(who);
  if (suitsWho) {
    score += 2;
    reasons.push(t('greatFor', { who: t(SUITS_LABEL[who]) }));
  }

  if (item.kind === 'group' && (who === 'solo' || who === 'friends')) score += 1;

  if (profile.stay === 'weekend' && item.lengthBucket === 'multi' && item.hours > 48) score -= 2;

  const great = shared.length > 0 && (!who || !suitsKnown || suitsWho);
  return { score, great, reasons: reasons.filter(Boolean) };
}

/** Sort by best match; ties fall back to soonest group trip, then newest. */
export function rankExperiences(items, profile) {
  return items
    .map((item) => ({ item, match: scoreExperience(item, profile) }))
    .sort((a, b) => {
      if (b.match.score !== a.match.score) return b.match.score - a.match.score;
      if (a.item.startDate && b.item.startDate) return new Date(a.item.startDate) - new Date(b.item.startDate);
      return new Date(b.item.createdAt || 0) - new Date(a.item.createdAt || 0);
    });
}

export const companionLabel = (id) => byId(COMPANIONS, id)?.label;
