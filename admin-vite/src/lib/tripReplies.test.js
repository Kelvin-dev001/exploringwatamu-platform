import { describe, expect, it } from 'vitest';
import { defaultReplyTemplate, tripReplyMessage } from '@/lib/tripReplies';

// Prefilled WhatsApp replies to a trip request: they name the reference and
// fit where the request stands. The admin edits them before WhatsApp opens.

const request = (overrides = {}) => ({
  reference: 'EW-ABC234',
  status: 'new',
  contact: { name: 'Amina Hassan', email: 'amina@example.com', phone: '+254712345678', country: 'Kenya' },
  adults: 2,
  children: 1,
  arrival: '2027-01-10T00:00:00.000Z',
  departure: '2027-01-12T00:00:00.000Z',
  notes: 'Honeymoon; allergic to shellfish',
  ...overrides,
});

describe('trip request replies', () => {
  it('thanks a new request, with the reference, dates and party', () => {
    expect(tripReplyMessage(request())).toBe(
      'Hi Amina, this is Exploring Watamu about your trip request EW-ABC234 (10 Jan – 12 Jan 2027, 2 adults, 1 child). Thank you for planning your Watamu trip with us! We’re checking availability now and will send your quote soon. Is there anything you’d like to add or ask?'
    );
  });

  it('talks about the quote once it is sent', () => {
    const r = request({ status: 'quoted', quote: { total: 145000, validUntil: '2027-01-01T00:00:00.000Z' } });
    expect(defaultReplyTemplate(r)).toBe('quote');
    expect(tripReplyMessage(r)).toBe(
      'Hi Amina, this is Exploring Watamu about your trip request EW-ABC234. Your quote is ready: KES 145,000 for the whole trip, valid until 1 January. Do you have any questions, or would you like us to change anything?'
    );
  });

  it('picks the template from the status', () => {
    expect(defaultReplyTemplate(request({ status: 'quoted' }))).toBe('received'); // no total yet
    expect(defaultReplyTemplate(request({ status: 'accepted' }))).toBe('confirmed');
    expect(defaultReplyTemplate(request({ status: 'declined' }))).toBe('followUp');
    expect(defaultReplyTemplate(request({ status: 'cancelled' }))).toBe('followUp');
    expect(tripReplyMessage(request({ status: 'accepted' }))).toMatch(/^Hi Amina, this is Exploring Watamu\. Thank you for confirming your Watamu trip \(EW-ABC234\)!/);
    expect(tripReplyMessage(request(), 'quote')).toMatch(/We’re checking availability now/); // nothing to quote yet
  });

  it('copes with flexible dates and a missing name', () => {
    const text = tripReplyMessage(request({ arrival: null, departure: null, children: 0, adults: 1, contact: { name: '' } }), 'question');
    expect(text).toBe('Hi, this is Exploring Watamu about your trip request EW-ABC234 (flexible dates, 1 adult). We have a quick question before we send your quote: '); // ends with a space: the admin types straight on
  });

  it('never repeats the traveller’s notes or contact details', () => {
    for (const t of ['received', 'question', 'quote', 'confirmed', 'followUp']) {
      const text = tripReplyMessage(request({ quote: { total: 1000 } }), t);
      expect(text).not.toMatch(/Honeymoon|shellfish|amina@|712345678|Hassan/);
    }
  });
});
