import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ago, date, dateRange, isEmail, kes, kesShort, notifiedMessage, waNumber } from '@/lib/utils';

describe('money', () => {
  it('formats KES, with a dash for missing values', () => {
    expect(kes(83000)).toBe('KES 83,000');
    expect(kes('6500.4')).toBe('KES 6,500');
    expect([kes(null), kes(''), kes('abc')]).toEqual(['—', '—', '—']);
  });

  it('shortens big amounts for stat tiles', () => {
    expect(kesShort(1_250_000)).toBe('KES 1.3M');
    expect(kesShort(12_000_000)).toBe('KES 12M');
    expect(kesShort(45_000)).toBe('KES 45K');
    expect(kesShort(9500)).toBe('KES 9,500');
  });
});

describe('dates are shown in East Africa Time whatever the device', () => {
  const tz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/Los_Angeles';
  });
  afterAll(() => {
    process.env.TZ = tz;
  });

  it('a late-evening booking in UTC is already the next day in Watamu', () => {
    expect(date('2026-11-10T22:30:00Z')).toBe('11 Nov');
  });

  it('a stored calendar date keeps its day', () => {
    expect(date('2027-01-10T00:00:00Z', { day: 'numeric', month: 'long' })).toBe('10 January');
    expect(dateRange('2027-01-10T00:00:00Z', '2027-01-13T00:00:00Z')).toBe('10 Jan – 13 Jan 2027');
    expect(dateRange(null, null)).toBe('Flexible dates');
    expect(date(null)).toBe('—');
  });
});

describe('ago', () => {
  it('reads like a person would say it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
    expect(ago('2026-11-10T11:59:40Z')).toBe('just now');
    expect(ago('2026-11-10T11:45:00Z')).toBe('15 min ago');
    expect(ago('2026-11-10T07:00:00Z')).toBe('5 h ago');
    expect(ago('2026-11-07T12:00:00Z')).toBe('3 d ago');
    expect(ago('2026-10-01T12:00:00Z')).toBe('1 Oct');
    vi.useRealTimers();
  });
});

describe('waNumber (WhatsApp links)', () => {
  it('turns Kenyan local numbers into international ones', () => {
    expect(waNumber('0712 345 678')).toBe('254712345678');
    expect(waNumber('0112345678')).toBe('254112345678');
  });

  it('keeps international numbers and rejects junk', () => {
    expect(waNumber('+44 7700 900123')).toBe('447700900123');
    expect(waNumber('12345')).toBeNull();
    expect(waNumber('')).toBeNull();
  });
});

describe('notifiedMessage', () => {
  it('only says "emailed" when the API says email went out', () => {
    expect(notifiedMessage({ email: true }, { done: 'Quote saved.', emailed: 'Quote sent' })).toEqual(['Quote sent', 'ok']);
    const [message, tone] = notifiedMessage({ email: false }, { done: 'Quote saved.', emailed: 'Quote sent' });
    expect(tone).toBe('warn');
    expect(message).toMatch(/^Quote saved\. .*NOT emailed/);
    expect(notifiedMessage(null, { done: 'Marked as new.', emailed: 'x' })).toEqual(['Marked as new.', 'ok']);
  });
});

describe('isEmail', () => {
  it('accepts plausible addresses only', () => {
    expect(isEmail('ops@exploringwatamu.com')).toBe(true);
    expect([isEmail('ops@'), isEmail('a b@c.d'), isEmail(undefined)]).toEqual([false, false, false]);
  });
});
