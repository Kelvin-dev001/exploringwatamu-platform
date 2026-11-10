'use strict';

const { createTripRequestSchema, sendQuoteSchema } = require('../src/validators/tripRequestValidators');

const base = {
  contact: { name: 'Amina', email: 'AMINA@example.com' },
  adults: 2,
  days: [{ label: 'Day 1', items: [{ kind: 'tour', title: 'Snorkel', hours: 4, listedPrice: null }] }],
};

describe('trip request validation', () => {
  it('normalises a valid request', () => {
    const r = createTripRequestSchema.parse({ ...base, arrival: '2027-01-10', departure: '2027-01-12' });
    expect(r.contact.email).toBe('amina@example.com');
    expect(r.children).toBe(0);
    expect(r.residency).toBe('nonResident');
    expect(r.days[0].items[0].listedPrice).toBe(undefined);
    expect(r.arrival instanceof Date).toBe(true);
  });

  it('treats unknown item kinds as "other"', () => {
    const r = createTripRequestSchema.parse({ ...base, days: [{ items: [{ kind: 'spaceship', title: 'X' }] }] });
    expect(r.days[0].items[0].kind).toBe('other');
  });

  it('keeps stays, car hire and services as their own kinds (they used to collapse to "other")', () => {
    const ideas = [
      { kind: 'stay', refId: 'h1', title: 'Stay · Hemingways' },
      { kind: 'carhire', refId: 'c1', title: 'Car hire · RAV4' },
      { kind: 'service', refId: 's1', title: 'Private chef' },
    ];
    const r = createTripRequestSchema.parse({ ...base, ideas });
    expect(r.ideas.map((i) => i.kind)).toEqual(['stay', 'carhire', 'service']);
  });

  it('rejects an empty trip and backwards dates', () => {
    expect(() => createTripRequestSchema.parse({ ...base, days: [], ideas: [] })).toThrow(/at least one experience/);
    expect(() => createTripRequestSchema.parse({ ...base, arrival: '2027-01-12', departure: '2027-01-10' })).toThrow(/Departure/);
  });

  it('rejects the honeypot', () => {
    expect(() => createTripRequestSchema.parse({ ...base, website: 'x' })).toThrow(/Spam/);
  });

  it('coerces quote amounts and requires a line', () => {
    expect(sendQuoteSchema.parse({ lines: [{ label: 'Snorkel', amount: '13000' }] }).lines[0].amount).toBe(13000);
    expect(() => sendQuoteSchema.parse({ lines: [] })).toThrow(/at least one quote line/);
  });
});
