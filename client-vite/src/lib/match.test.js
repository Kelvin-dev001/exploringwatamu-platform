import { describe, expect, it } from 'vitest';
import { companionLabel, rankExperiences, scoreExperience } from '@/lib/match';

const item = (extra = {}) => ({ id: 'x', kind: 'tour', vibes: [], suits: [], lengthBucket: 'half', hours: 4, createdAt: '2026-01-01', ...extra });
const couple = { vibes: ['ocean', 'romance'], companions: 'couple', stay: 'short' };

describe('scoreExperience', () => {
  it('scores nothing without a profile', () => {
    expect(scoreExperience(item({ vibes: ['ocean'] }), null)).toEqual({ score: 0, great: false, reasons: [] });
  });

  it('adds 3 per shared vibe and 2 when it suits who is coming, with reasons', () => {
    const m = scoreExperience(item({ vibes: ['ocean', 'romance', 'culture'], suits: ['couple'] }), couple);
    expect(m.score).toBe(8);
    expect(m.great).toBe(true);
    expect(m.reasons).toEqual(['Ocean & Reef', 'Romance', 'Great for couples']);
  });

  it('is not a great match when it is meant for someone else', () => {
    const m = scoreExperience(item({ vibes: ['ocean'], suits: ['family'] }), couple);
    expect(m).toMatchObject({ score: 3, great: false });
  });

  it('is still great when the listing says nothing about who it suits', () => {
    expect(scoreExperience(item({ vibes: ['romance'] }), couple).great).toBe(true);
  });

  it('nudges group trips for solo travellers and friends', () => {
    const solo = { vibes: ['social'], companions: 'solo' };
    expect(scoreExperience(item({ kind: 'group', vibes: ['social'] }), solo).score).toBe(4);
    expect(scoreExperience(item({ kind: 'tour', vibes: ['social'] }), solo).score).toBe(3);
  });

  it('demotes long multi-day trips for a weekend visit', () => {
    const weekend = { vibes: ['adventure'], stay: 'weekend' };
    expect(scoreExperience(item({ vibes: ['adventure'], lengthBucket: 'multi', hours: 72 }), weekend).score).toBe(1);
  });
});

describe('rankExperiences', () => {
  it('puts the best match first and attaches its match details', () => {
    const ranked = rankExperiences([item({ id: 'none' }), item({ id: 'best', vibes: ['ocean', 'romance'] }), item({ id: 'some', vibes: ['ocean'] })], couple);
    expect(ranked.map((r) => r.item.id)).toEqual(['best', 'some', 'none']);
    expect(ranked[0].match).toMatchObject({ score: 6, great: true });
  });

  it('on equal scores, orders group trips by the soonest start and other listings newest first', () => {
    const trips = [item({ id: 'later', kind: 'group', startDate: '2027-03-01' }), item({ id: 'sooner', kind: 'group', startDate: '2027-02-01' })];
    expect(rankExperiences(trips, couple).map((r) => r.item.id)).toEqual(['sooner', 'later']);
    const tours = [item({ id: 'older', createdAt: '2025-01-01' }), item({ id: 'newer', createdAt: '2026-06-01' })];
    expect(rankExperiences(tours, couple).map((r) => r.item.id)).toEqual(['newer', 'older']);
  });

  it('works without a profile (newest first)', () => {
    const list = [item({ id: 'old', createdAt: '2025-01-01' }), item({ id: 'new', createdAt: '2026-05-01' })];
    expect(rankExperiences(list, null).map((r) => r.item.id)).toEqual(['new', 'old']);
  });
});

describe('companionLabel', () => {
  it('names who is travelling', () => {
    expect(companionLabel('family')).toBe('Family');
    expect(companionLabel('pets')).toBeUndefined();
  });
});
