import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_ENCODED_MESSAGE,
  businessLink,
  businessNumber,
  encodedLength,
  fitsInLink,
  formatWhatsAppNumber,
  generalMessage,
  listingEnquiry,
  listingMessage,
  normaliseWhatsAppNumber,
  parseWhatsAppNumber,
  referenceMessage,
  tripMessage,
  whatsappEnabled,
  whatsappLink,
} from '@/lib/whatsapp';
import { addItem, emptyTrip, setDates, snapshotFor, toSnapshot, TRANSFERS } from '@/lib/trip';
import { normaliseTour } from '@/lib/catalog';

// Click-to-chat links: the number rules (same table as the API's and the
// admin's), URL encoding, and the prefilled messages.

const textOf = (link) => new URL(link).searchParams.get('text');

describe('WhatsApp numbers', () => {
  it.each([
    ['+254 712 345 678', '254712345678'],
    ['254712345678', '254712345678'],
    ['0712 345 678', '254712345678'],
    ['0112345678', '254112345678'],
    ['+254 0712 345 678', '254712345678'],
    ['+44 (0)20 7946 0018', '442079460018'],
    ['0044 20 7946 0018', '442079460018'],
    ['+1 (202) 555-0123', '12025550123'],
  ])('uses %s as %s', (input, digits) => {
    expect(normaliseWhatsAppNumber(input)).toBe(digits);
  });

  it.each([[''], [null], ['12345'], ['+1234567890123456'], ['+254 712 345'], ['2025550123'], ['0412 345 678'], ['07700 900123'], ['+0712345678'], ['0712 345 678 ext 2'], ['0712345678 / 0722345678']])(
    'refuses %j',
    (input) => {
      expect(normaliseWhatsAppNumber(input)).toBeNull();
    }
  );

  it('flags an assumed Kenyan local number and formats numbers for reading', () => {
    expect(parseWhatsAppNumber('0712 345 678')).toEqual({ digits: '254712345678', local: true });
    expect(formatWhatsAppNumber('254712345678')).toBe('+254 712 345 678');
    expect(formatWhatsAppNumber('447700900123')).toBe('+447700900123');
  });

  it('URL-encodes the message', () => {
    const link = whatsappLink('254712345678', 'Day 1 & 2:\nSnorkel #reef 100% "fun" 🐢?');
    expect(link).toBe('https://wa.me/254712345678?text=Day%201%20%26%202%3A%0ASnorkel%20%23reef%20100%25%20%22fun%22%20%F0%9F%90%A2%3F');
    expect(textOf(link)).toBe('Day 1 & 2:\nSnorkel #reef 100% "fun" 🐢?');
    expect(whatsappLink('254712345678', '')).toBe('https://wa.me/254712345678');
    expect(whatsappLink(null, 'Hi')).toBeNull();
  });
});

describe('the business number (VITE_WHATSAPP_NUMBER)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is off when unset or unusable', () => {
    vi.stubEnv('VITE_WHATSAPP_NUMBER', '');
    expect([businessNumber(), whatsappEnabled(), businessLink('Hi')]).toEqual([null, false, null]);
    vi.stubEnv('VITE_WHATSAPP_NUMBER', '0712 345');
    expect(whatsappEnabled()).toBe(false);
  });

  it('is normalised before links are made', () => {
    vi.stubEnv('VITE_WHATSAPP_NUMBER', '+254 712-345-678');
    expect(businessLink('Hi there')).toBe('https://wa.me/254712345678?text=Hi%20there');
  });
});

describe('listing enquiries', () => {
  it('names the listing and its public facts, with a link to its page', () => {
    const text = listingMessage({ kind: 'tour', title: 'Marine park snorkel', details: ['Half day', null, false, 'from KES 6,500 per adult (visitor price)'], path: '/experiences/t1' });
    expect(text).toBe(
      [
        'Hi Exploring Watamu! I’m interested in this experience:',
        '*Marine park snorkel* (Half day · from KES 6,500 per adult (visitor price))',
        'https://exploringwatamu.com/experiences/t1',
        '',
        'Could you tell me more and check availability for my dates?',
      ].join('\n')
    );
  });

  it('describes stays, transfers, cars and services from their listing fields', () => {
    expect(listingEnquiry('stay', { name: 'Turtle Bay', type: 'hotel', stars: 4, location: { address: 'Watamu beach' }, pricePerNight: 18000 })).toContain(
      '*Turtle Bay* (hotel · 4-star · Watamu beach · KES 18,000 per night)'
    );
    expect(listingEnquiry('transfer', { route: 'Malindi airport → Watamu', vehicle: { name: 'Noah van', capacity: 7 }, price: 4500 })).toContain(
      'this transfer:\n*Malindi airport → Watamu* (Noah van · 7 seats · KES 4,500 per vehicle)'
    );
    expect(listingEnquiry('carhire', { vehicle: { name: 'Prado', type: '4x4', capacity: 5 }, dailyRate: 9000 })).toContain('this car:\n*Prado* (4x4 · 5 seats · KES 9,000 per day)');
    expect(listingEnquiry('service', { name: 'Private chef', price: 6000, pricingType: 'per meal' })).toContain('this service:\n*Private chef* (KES 6,000 per meal)');
    expect(listingEnquiry('service', { name: 'Massage' })).toContain('*Massage*\n');
  });

  it('has general and reference openers', () => {
    expect(generalMessage()).toBe('Hi Exploring Watamu! I’m planning a trip to Watamu and have a question.');
    expect(generalMessage('hiring a car')).toBe('Hi Exploring Watamu! Could you help me with hiring a car in Watamu?');
    expect(referenceMessage('EW-ABC234', 'quote')).toBe('Hi Exploring Watamu! I have a question about my quote EW-ABC234.');
  });
});

describe('trip planner message', () => {
  const tour = (id, name, hours = 3) => toSnapshot(normaliseTour({ _id: id, name, description: 'd', durationHours: hours, priceForeignerAdult: 6500 }));

  function plannedTrip() {
    let t = emptyTrip({ stay: 'weekend' }); // 3 days
    t = setDates(t, '2027-01-08', '2027-01-10');
    t = { ...t, adults: 2, children: 1, notes: 'Honeymoon — I’m allergic to shellfish. Call me on +44 7700 900123.' };
    t = addItem(t, TRANSFERS.in, 0);
    t = addItem(t, tour('t1', 'Marine park snorkel'), 0);
    t = addItem(t, tour('t2', 'Gede ruins walk'), 1);
    t = addItem(t, snapshotFor('stay', { _id: 'h1', name: 'Turtle Bay', pricePerNight: 18000 }), 'ideas');
    t = addItem(t, snapshotFor('carhire', { _id: 'c1', vehicle: { name: 'Prado' }, dailyRate: 9000 }), 'ideas');
    t = addItem(t, snapshotFor('service', { _id: 's1', name: 'Private chef' }), 'ideas');
    t = addItem(t, snapshotFor('transfer', { _id: 'x1', route: 'Hotel → Malindi' }), 'ideas');
    t = addItem(t, tour('t3', 'Sunset dhow'), 'ideas');
    return t;
  }

  it('summarises dates, travellers, the days and everything else in the plan', () => {
    expect(tripMessage(plannedTrip())).toBe(
      [
        'Hi Exploring Watamu! Here’s my Watamu trip plan. Could you send me a quote?',
        '',
        'Dates: Fri 8 Jan 2027 – Sun 10 Jan 2027 (3 days)',
        'Travellers: 2 adults, 1 child',
        '',
        '*Day by day*',
        'Day 1 · Fri 8 Jan: Airport pick-up, Marine park snorkel',
        'Day 2 · Sat 9 Jan: Gede ruins walk',
        'Day 3 · Sun 10 Jan: free day',
        '',
        '*Stay:* Turtle Bay',
        '*Transfers:* Hotel → Malindi',
        '*Car hire:* Prado',
        '*Services:* Private chef',
        '*Experiences not on a day yet:* Sunset dhow',
      ].join('\n')
    );
  });

  it('says which day items are transfers, stays or group trips', () => {
    let t = emptyTrip({ stay: 'weekend' });
    t = addItem(t, TRANSFERS.in, 0);
    t = addItem(t, snapshotFor('transfer', { _id: 'x1', route: 'Malindi–Watamu' }), 0);
    t = addItem(t, snapshotFor('stay', { _id: 'h1', name: 'Turtle Bay' }), 1);
    expect(tripMessage(t)).toContain('Day 1: Airport pick-up, Transfer · Malindi–Watamu\nDay 2: Stay · Turtle Bay');
  });

  it('leaves the visitor’s notes and contact details out', () => {
    const text = tripMessage(plannedTrip());
    expect(text).not.toMatch(/Honeymoon|shellfish|7700/);
  });

  it('names the request reference once the plan has been sent', () => {
    const text = tripMessage({ ...plannedTrip(), lastRequest: { reference: 'EW-ABC234' } });
    expect(text.split('\n').slice(0, 3)).toEqual(['Hi Exploring Watamu! Here’s my Watamu trip plan.', '', 'Reference: EW-ABC234']);
  });

  it('says when the dates are flexible', () => {
    const t = { ...emptyTrip({ stay: 'week' }), adults: 1, children: 0 };
    expect(tripMessage(t)).toContain('Dates: 7 days, dates flexible\nTravellers: 1 adult');
  });

  it('first drops the dates from the day lines and clips long names', () => {
    let t = setDates(emptyTrip({ stay: 'week' }), '2027-01-01', '2027-01-10'); // 10 days
    for (let i = 0; i < 20; i += 1) t = addItem(t, tour(`t${i}`, `Snorkelling and turtle watching at the Watamu Marine National Park ${i}`, 1), i % 10);
    const text = tripMessage(t);
    expect(fitsInLink(text)).toBe(true);
    expect(text).toContain('\nDay 1: Snorkelling and turtle watching at the…, Snorkelling and turtle watching at the…\n');
    expect(text).not.toContain('Day 1 · Fri');
  });

  it('shortens a long plan step by step so the link stays a sensible size', () => {
    let t = setDates(emptyTrip({ stay: 'week' }), '2027-01-01', '2027-01-30'); // 30 days
    for (let i = 0; i < 60; i += 1) t = addItem(t, tour(`t${i}`, `A very long experience name number ${i} with extra words`, 1), i % 30);
    for (let i = 0; i < 20; i += 1) t = addItem(t, snapshotFor('service', { _id: `s${i}`, name: `Service with a long name ${i}` }), 'ideas');

    const text = tripMessage(t);
    expect(encodedLength(text)).toBeLessThanOrEqual(MAX_ENCODED_MESSAGE);
    expect(fitsInLink(text)).toBe(true);
    expect(text).toContain('Dates: Fri 1 Jan 2027 – Sat 30 Jan 2027 (30 days)');

    // 200 items: only the summary fits.
    for (let i = 60; i < 200; i += 1) t = addItem(t, tour(`t${i}`, `Another long experience name ${i}`, 1), 'ideas');
    const summary = tripMessage(t);
    expect(fitsInLink(summary)).toBe(true);
    expect(summary).toContain('My plan has 200 experiences, 20 services.');
  });

  it('measures the encoded length, not the characters', () => {
    expect(encodedLength('a b')).toBe(5);
    expect(encodedLength('🐢')).toBe(12);
    expect(fitsInLink('x'.repeat(MAX_ENCODED_MESSAGE))).toBe(true);
    expect(fitsInLink(' '.repeat(10) + 'x'.repeat(MAX_ENCODED_MESSAGE + 1))).toBe(false);
  });
});
