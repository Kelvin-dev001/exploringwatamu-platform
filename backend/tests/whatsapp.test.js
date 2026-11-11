'use strict';

// WhatsApp click-to-chat in emails and PDFs. Links only — nothing is sent to
// WhatsApp. Mail and SMS transports are mocked: no real message leaves.

jest.mock('../src/services/mailer', () => ({ sendMail: jest.fn(async () => ({})) }));
jest.mock('../src/services/notifications/sms', () => ({ sendSms: jest.fn(async () => ({})) }));

const { sendMail } = require('../src/services/mailer');
const config = require('../src/config/env');
const { parseWhatsAppNumber, normaliseWhatsAppNumber, formatWhatsAppNumber, whatsappLink } = require('../src/utils/whatsappNumber');
const whatsapp = require('../src/services/whatsapp');
const { notifyTripRequested, notifyQuoteSent, notifyStatus } = require('../src/services/tripRequestNotifications');
const { notifyBookingRequested, notifyBookingConfirmed } = require('../src/services/bookingNotifications');
const { buildTripQuotePdf, buildQuotationPdf } = require('../src/services/documents');

const NUMBER = '254712345678';
const mails = () => sendMail.mock.calls.map(([m]) => m);
const hrefs = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);

const tripRequest = (overrides = {}) => ({
  reference: 'EW-ABC234',
  user: null,
  contact: { name: 'Amina', email: 'amina@example.com', phone: '+254700000000' },
  adults: 2,
  children: 0,
  arrival: new Date('2027-01-10'),
  departure: new Date('2027-01-12'),
  days: [{ label: 'Day 1', items: [{ kind: 'tour', title: 'Snorkel' }] }],
  ideas: [],
  quote: { lines: [{ label: 'Snorkel x2', amount: 13000 }], total: 13000, validUntil: new Date('2027-01-01') },
  ...overrides,
});
const booking = { _id: '665f1c2b9a1e4b0012345678', user: 'u1', fullName: 'Juma', email: 'juma@example.com', phone: '0700000000', paymentType: 'deposit', amountPaid: 5000, amountDue: 15000 };
const trip = { title: 'Reef & "Rhythm" <b>', startDate: new Date('2027-02-01'), endDate: new Date('2027-02-03'), fullPrice: 20000 };

describe('WhatsApp numbers', () => {
  it.each([
    ['+254 712 345 678', '254712345678'],
    ['+254-712-345-678', '254712345678'],
    ['254712345678', '254712345678'],
    ['0712 345 678', '254712345678'],
    ['0112345678', '254112345678'],
    ['(0712) 345678', '254712345678'],
    ['+254 0712 345 678', '254712345678'],
    ['+254 20 1234567', '254201234567'],
    ['+44 7700 900123', '447700900123'],
    ['+44 (0)20 7946 0018', '442079460018'],
    ['0044 20 7946 0018', '442079460018'],
    ['+1 (202) 555-0123', '12025550123'],
    ['+39 06 1234 5678', '390612345678'],
  ])('uses %s as %s', (input, digits) => {
    expect(normaliseWhatsAppNumber(input)).toBe(digits);
  });

  it.each([
    ['', 'empty'],
    [null, 'missing'],
    ['12345', 'too short'],
    ['+1234567', 'too short for E.164 (7 digits)'],
    ['+1234567890123456', 'more than 15 digits'],
    ['+254 712 345', 'a Kenyan number with digits missing'],
    ['+254 712 345 6789', 'a Kenyan number with a digit too many'],
    ['2025550123', 'no country code (American or not?)'],
    ['0412 345 678', 'local format outside Kenya (Australian?)'],
    ['07700 900123', 'UK local format'],
    ['+0712345678', 'a country code cannot start with 0'],
    ['0712 345 678 ext 2', 'letters'],
    ['0712345678 / 0722345678', 'two numbers'],
    ['+254 712+345 678', 'a plus in the middle'],
  ])('refuses %j (%s)', (input) => {
    expect(normaliseWhatsAppNumber(input)).toBeNull();
  });

  it('says when a Kenyan local number was assumed', () => {
    expect(parseWhatsAppNumber('0712 345 678')).toEqual({ digits: '254712345678', local: true });
    expect(parseWhatsAppNumber('+254 712 345 678')).toEqual({ digits: '254712345678', local: false });
  });

  it('writes numbers out for people to read', () => {
    expect(formatWhatsAppNumber('254712345678')).toBe('+254 712 345 678');
    expect(formatWhatsAppNumber('447700900123')).toBe('+447700900123');
    expect(formatWhatsAppNumber('')).toBe('');
  });

  it('builds wa.me links with the message URL-encoded', () => {
    expect(whatsappLink('254712345678')).toBe('https://wa.me/254712345678');
    expect(whatsappLink('254712345678', '  ')).toBe('https://wa.me/254712345678');
    const link = whatsappLink('254712345678', 'Hi! Day 1 & 2:\nSnorkel #reef 100% "fun" 🐢?');
    expect(link).toBe('https://wa.me/254712345678?text=Hi!%20Day%201%20%26%202%3A%0ASnorkel%20%23reef%20100%25%20%22fun%22%20%F0%9F%90%A2%3F');
    expect(new URL(link).searchParams.get('text')).toBe('Hi! Day 1 & 2:\nSnorkel #reef 100% "fun" 🐢?');
    expect(whatsappLink(null, 'Hi')).toBeNull();
  });
});

describe('WHATSAPP_NUMBER', () => {
  const original = process.env.WHATSAPP_NUMBER;
  const load = (value) => {
    jest.resetModules();
    process.env.WHATSAPP_NUMBER = value;
    return require('../src/config/env').whatsapp;
  };
  afterEach(() => {
    if (original === undefined) delete process.env.WHATSAPP_NUMBER;
    else process.env.WHATSAPP_NUMBER = original;
    jest.resetModules();
  });

  it('is normalised to digits', () => {
    expect(load('+254 712 345 678')).toEqual({ number: '254712345678', invalid: false });
    expect(load('0712345678')).toEqual({ number: '254712345678', invalid: false });
  });

  it('turns the links off when unset', () => {
    expect(load('')).toEqual({ number: '', invalid: false });
  });

  it('turns the links off (and is flagged for a startup warning) when unusable, without stopping the API', () => {
    expect(load('0712 345')).toEqual({ number: '', invalid: true });
    expect(load('call us')).toEqual({ number: '', invalid: true });
  });
});

describe('WhatsApp in quotation emails', () => {
  const saved = { ...config.whatsapp };
  const setNumber = (number) => Object.assign(config.whatsapp, { number, invalid: false });
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => Object.assign(config.whatsapp, saved));

  it('adds a WhatsApp button to the quote email, naming the quote reference', async () => {
    setNumber(NUMBER);
    await notifyQuoteSent(tripRequest());
    const [mail] = mails();
    const link = hrefs(mail.html).find((h) => h.startsWith('https://wa.me/'));
    expect(link).toBe('https://wa.me/254712345678?text=Hi%20ExploringWatamu!%20I%20have%20a%20question%20about%20my%20quote%20EW-ABC234.');
    expect(mail.html).toContain('Chat on WhatsApp');
    expect(mail.html).toContain('+254 712 345 678');
  });

  it('adds one to the trip-request acknowledgement, but never to the team’s copy', async () => {
    setNumber(NUMBER);
    await notifyTripRequested(tripRequest());
    const [ack, admin] = mails();
    expect(ack.html).toContain('https://wa.me/254712345678?text=Hi%20ExploringWatamu!%20I%20have%20a%20question%20about%20my%20trip%20request%20EW-ABC234.');
    expect(admin.html).not.toContain('wa.me');
  });

  it('adds one to the group-trip quotation, with the title encoded and the attribute escaped', async () => {
    setNumber(NUMBER);
    await notifyBookingRequested(booking, trip);
    const [traveller, admin] = mails();
    const link = hrefs(traveller.html).find((h) => h.startsWith('https://wa.me/'));
    expect(link).toBeDefined();
    expect(link).not.toMatch(/[<>"\s]/);
    const text = new URL(link.replace(/&amp;/g, '&')).searchParams.get('text');
    expect(text).toBe('Hi ExploringWatamu! I have a question about my booking for "Reef & "Rhythm" <b>" (reference 665f1c2b9a1e4b0012345678).');
    expect(traveller.html).not.toContain('<b>"');
    expect(admin.html).not.toContain('wa.me');
  });

  it('leaves WhatsApp out of every email while no number is configured', async () => {
    setNumber('');
    await notifyTripRequested(tripRequest());
    await notifyQuoteSent(tripRequest());
    await notifyStatus(tripRequest(), 'accepted');
    await notifyBookingRequested(booking, trip);
    await notifyBookingConfirmed(booking, trip);
    for (const mail of mails()) {
      expect(mail.html).not.toContain('wa.me');
      expect(mail.html).not.toContain('WhatsApp');
    }
    expect(whatsapp.emailBlock({ lead: 'x', text: 'y' })).toBe('');
  });
});

describe('WhatsApp in quotation PDFs', () => {
  const saved = { ...config.whatsapp };
  afterEach(() => Object.assign(config.whatsapp, saved));
  const uris = (pdf) => [...pdf.toString('latin1').matchAll(/\/URI \(([^)]*)\)/g)].map((m) => m[1]);

  it('links the WhatsApp number on the trip quote and the group-trip quotation', async () => {
    Object.assign(config.whatsapp, { number: NUMBER });
    expect(uris(await buildTripQuotePdf(tripRequest()))).toEqual([
      'https://wa.me/254712345678?text=Hi%20ExploringWatamu!%20I%20have%20a%20question%20about%20my%20quote%20EW-ABC234.',
    ]);
    const [link] = uris(await buildQuotationPdf(booking, trip));
    expect(link).toMatch(/^https:\/\/wa\.me\/254712345678\?text=.*665f1c2b9a1e4b0012345678/);
  });

  it('has no WhatsApp link without a number', async () => {
    Object.assign(config.whatsapp, { number: '' });
    expect(uris(await buildTripQuotePdf(tripRequest()))).toEqual([]);
  });
});
