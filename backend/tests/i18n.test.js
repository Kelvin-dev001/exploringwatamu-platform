'use strict';

// Traveller emails, SMS and PDFs in the traveller's language: the two message
// files stay in step, Italian reads Italian, English is exactly what it was,
// and anything unknown falls back to English. Transports are mocked.

jest.mock('../src/services/mailer', () => ({ sendMail: jest.fn(async () => ({})) }));
jest.mock('../src/services/notifications/sms', () => ({ sendSms: jest.fn(async () => ({})) }));

const { sendMail } = require('../src/services/mailer');
const { sendSms } = require('../src/services/notifications/sms');
const i18n = require('../src/i18n');
const { normaliseLocale } = require('../src/constants/locales');
const { parseItalian, ITALIAN_FIELDS } = require('../src/constants/italianContent');
const { notifyTripRequested, notifyQuoteSent, notifyStatus } = require('../src/services/tripRequestNotifications');
const { notifyBookingRequested, notifyBookingConfirmed, notifyBookingCancelled } = require('../src/services/bookingNotifications');
const { buildQuotationPdf, buildReceiptPdf, buildTripQuotePdf } = require('../src/services/documents');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../src/services/notifications/authNotifications');
const { inviteEmail } = require('../src/services/reviewNotifications');
const whatsapp = require('../src/services/whatsapp');

const mails = () => sendMail.mock.calls.map(([m]) => m);
const isPdf = (buf) => Buffer.isBuffer(buf) && buf.subarray(0, 5).toString() === '%PDF-';
const base = (key) => key.replace(/_(zero|one|two|few|many|other)$/, '');
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const tripRequest = (overrides = {}) => ({
  reference: 'EW-ABC234',
  user: null,
  locale: 'it',
  contact: { name: 'Giulia Rossi', email: 'giulia@example.com', phone: '+393331234567' },
  adults: 2,
  children: 1,
  residency: 'nonResident',
  arrival: new Date('2027-01-10'),
  departure: new Date('2027-01-12'),
  days: [
    { label: 'Day 1 · Sun 10 Jan', date: new Date('2027-01-10'), items: [{ kind: 'transfer', title: 'Airport pick-up' }, { kind: 'tour', title: 'Marine park snorkel' }] },
    { label: 'Day 2 · Mon 11 Jan', date: new Date('2027-01-11'), items: [] },
  ],
  ideas: [{ kind: 'stay', title: 'Stay · Turtle Bay (listed KES 18,000 / night)' }],
  quote: { lines: [{ label: 'Snorkel x2', amount: 13000 }, { label: 'Transfers', amount: 6000 }], total: 19000, validUntil: new Date('2027-01-01') },
  ...overrides,
});
const booking = (overrides = {}) => ({ _id: 'b1', user: 'u1', locale: 'it', fullName: 'Marco Bianchi', email: 'marco@example.com', phone: '+393331234567', paymentType: 'deposit', amountPaid: 5000, amountDue: 15000, travelPersonalities: ['Beach Bum'], travelGroup: 'Solo But Social', ...overrides });
const trip = { title: 'Reef & Rhythm', titleIt: 'Barriera e ritmo', startDate: new Date('2027-02-01'), endDate: new Date('2027-02-03'), fullPrice: 20000, meetingPoint: 'Watamu Beach' };

beforeEach(() => jest.clearAllMocks());

describe('the message files', () => {
  it('have the same messages in English and Italian, with the same placeholders', () => {
    const { en, it: italian } = i18n.MESSAGES;
    expect([...new Set(Object.keys(italian).map(base))].sort()).toEqual([...new Set(Object.keys(en).map(base))].sort());
    for (const key of Object.keys(italian)) {
      const english = en[key] ?? en[`${base(key)}_other`] ?? en[base(key)];
      expect({ key, vars: placeholders(italian[key]) }).toEqual({ key, vars: placeholders(english) });
    }
    for (const value of Object.values(italian)) expect(typeof value).toBe('string');
  });

  it('falls back to English for an unknown language or message', () => {
    expect(normaliseLocale('fr')).toBe('en');
    expect(normaliseLocale(undefined)).toBe('en');
    expect(i18n.translate('fr', 'quoteTotal')).toBe('Total');
    expect(i18n.translate('it', 'no-such-key')).toBe('no-such-key');
  });

  it('picks Italian plurals from a count', () => {
    expect(i18n.translate('it', 'adults', { count: 1 })).toBe('1 adulto');
    expect(i18n.translate('it', 'adults', { count: 2 })).toBe('2 adulti');
    expect(i18n.translate('en', 'children', { count: 1 })).toBe('1 child');
  });
});

describe('formatting', () => {
  it('writes money and dates the traveller’s way, English exactly as before', () => {
    expect(i18n.money(19000, 'en')).toBe('KES 19,000');
    expect(i18n.money(19000, 'it')).toBe('19.000 KES');
    expect(i18n.date('2027-01-10', 'en')).toBe(new Date('2027-01-10').toDateString());
    expect(i18n.date('2027-01-10', 'it')).toBe('dom 10 gen 2027');
    expect(i18n.date(null, 'it', 'Da definire')).toBe('Da definire');
  });

  it('puts website paths in the traveller’s language', () => {
    expect(i18n.sitePath('/reset-password', 'it')).toBe('/it/reset-password');
    expect(i18n.sitePath('/', 'it')).toBe('/it');
    expect(i18n.sitePath('/reset-password', 'en')).toBe('/reset-password');
  });

  it('says the website’s own item words in Italian and leaves listing names alone', () => {
    expect(i18n.itemTitle('Stay · Turtle Bay (listed KES 18,000 / night)', 'it')).toBe('Alloggio · Turtle Bay (prezzo di listino KES 18,000 / night)');
    expect(i18n.itemTitle('Car hire · Prado', 'it')).toBe('Noleggio auto · Prado');
    expect(i18n.itemTitle('Airport pick-up', 'it')).toBe('Transfer dall’aeroporto');
    expect(i18n.itemTitle('Marine park snorkel', 'it')).toBe('Marine park snorkel');
    expect(i18n.itemTitle('Stay · Turtle Bay', 'en')).toBe('Stay · Turtle Bay');
  });
});

describe('trip request emails in Italian', () => {
  it('acknowledges in Italian, and the team still gets English with the language noted', async () => {
    await notifyTripRequested(tripRequest());
    const [ack, admin] = mails();
    expect(ack.subject).toBe('Abbiamo ricevuto il tuo viaggio a Watamu (EW-ABC234)');
    expect(ack.html).toContain('lang="it"');
    expect(ack.html).toContain('Ciao Giulia Rossi,');
    expect(ack.html).toContain('Giorno 1 · dom 10 gen');
    expect(ack.html).toContain('Transfer dall’aeroporto');
    expect(ack.html).toContain('Alloggio · Turtle Bay');
    expect(ack.html).toContain('Domande?');
    expect(ack.html).not.toContain('Questions?');
    expect(admin.subject).toBe('New trip request EW-ABC234 — Giulia Rossi');
    expect(admin.html).toContain('Language: Italian');
    expect(admin.html).toContain('Day 1 · Sun 10 Jan');
    expect(sendSms).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/^Ciao Giulia Rossi, abbiamo ricevuto/) }));
  });

  it('sends the quote in Italian with Italian amounts and an Italian PDF', async () => {
    await notifyQuoteSent(tripRequest());
    const [mail] = mails();
    expect(mail.subject).toBe('Il preventivo per il tuo viaggio a Watamu (EW-ABC234)');
    expect(mail.html).toContain('19.000 KES');
    expect(mail.html).toContain('Totale');
    expect(mail.html).toContain('valido fino al <strong>ven 1 gen 2027</strong>');
    expect(isPdf(mail.attachments[0].content)).toBe(true);
    expect(sendSms).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('19.000 KES') }));
  });

  it('greets once: not again when the team’s message already opens with a greeting', async () => {
    await notifyQuoteSent(tripRequest({ quote: { ...tripRequest().quote, message: 'Ciao Giulia,\n\necco il prezzo.' } }));
    await notifyQuoteSent(tripRequest({ locale: 'en', quote: { ...tripRequest().quote, message: 'Karibu! Here it is.' } }));
    const [italian, english] = mails();
    expect(italian.html).toContain('Ciao Giulia,<br/>');
    expect(italian.html).not.toContain('Ciao Giulia Rossi,');
    expect(english.html).toContain('Hi Giulia Rossi,');
  });

  it('keeps the quote total itself unchanged', async () => {
    const r = tripRequest();
    await notifyQuoteSent(r);
    expect(r.quote.total).toBe(19000);
    expect(r.quote.lines.map((l) => l.amount)).toEqual([13000, 6000]);
  });

  it('confirms in Italian', async () => {
    await notifyStatus(tripRequest(), 'accepted');
    expect(mails()[0].subject).toBe('Il tuo viaggio è confermato (EW-ABC234)');
  });

  it('is English for an older request with no language, exactly as before', async () => {
    await notifyTripRequested(tripRequest({ locale: undefined }));
    const [ack] = mails();
    expect(ack.subject).toBe('We’ve got your Watamu trip (EW-ABC234)');
    expect(ack.html).toContain('lang="en"');
    expect(ack.html).toContain('Day 1 · Sun 10 Jan');
    expect(ack.html).toContain('Stay · Turtle Bay (listed KES 18,000 / night)');
    expect(ack.html).toContain('Questions? ');
    expect(sendSms).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/^Hi Giulia Rossi, we received your Watamu trip request EW-ABC234/) }));
  });
});

describe('group booking emails in Italian', () => {
  it('uses the trip’s Italian title and Italian copy for the traveller, English for the team', async () => {
    await notifyBookingRequested(booking(), trip);
    const [traveller, admin] = mails();
    expect(traveller.subject).toBe('Abbiamo ricevuto la tua richiesta di prenotazione - Barriera e ritmo');
    expect(traveller.html).toContain('in attesa di conferma');
    expect(isPdf(traveller.attachments[0].content)).toBe(true);
    expect(admin.subject).toBe('New booking request - Reef & Rhythm (Marco Bianchi)');
    expect(admin.html).toContain('Language: Italian');
    expect(isPdf(admin.attachments[0].content)).toBe(true);
  });

  it('confirms and cancels in Italian', async () => {
    await notifyBookingConfirmed(booking(), trip);
    await notifyBookingCancelled(booking(), null);
    const [confirmed, cancelled] = mails();
    expect(confirmed.subject).toBe('Prenotazione confermata - Barriera e ritmo');
    expect(cancelled.subject).toBe('Prenotazione annullata - il tuo viaggio');
    expect(sendSms).toHaveBeenLastCalledWith(expect.objectContaining({ message: expect.stringContaining('la tua prenotazione per il viaggio è stata annullata') }));
  });

  it('falls back to the English title when the trip has no Italian one', async () => {
    await notifyBookingConfirmed(booking(), { ...trip, titleIt: '' });
    expect(mails()[0].subject).toBe('Prenotazione confermata - Reef & Rhythm');
  });
});

describe('PDFs', () => {
  it('build in Italian and in English (including older records with no language)', async () => {
    for (const locale of ['it', 'en', undefined]) {
      expect(isPdf(await buildQuotationPdf(booking({ locale }), trip))).toBe(true);
      expect(isPdf(await buildReceiptPdf(booking({ locale }), trip))).toBe(true);
      expect(isPdf(await buildTripQuotePdf(tripRequest({ locale })))).toBe(true);
    }
  });
});

describe('other traveller emails', () => {
  it('sends the password reset in Italian with the Italian link it was given', async () => {
    await sendPasswordResetEmail({ _id: 'u1', email: 'giulia@example.com', name: 'Giulia' }, 'https://site.test/it/reset-password?token=abc', 'it');
    const [mail] = mails();
    expect(mail.subject).toMatch(/^Reimposta la password di /);
    expect(mail.html).toContain('Reimposta la password');
    expect(mail.html).toContain('https://site.test/it/reset-password?token=abc');
  });

  it('sends the email confirmation in Italian with the Italian link it was given', async () => {
    await sendVerificationEmail({ _id: 'u1', email: 'giulia@example.com', name: 'Giulia' }, 'https://site.test/it/verify-email?token=abc', 'it');
    const [mail] = mails();
    expect(mail.subject).toMatch(/^Conferma la tua email per /);
    expect(mail.html).toContain('Conferma la mia email');
    expect(mail.html).toContain('72 ore');
    expect(mail.html).toContain('https://site.test/it/verify-email?token=abc');
  });

  it('writes the review invitation in Italian', () => {
    const { subject, html } = inviteEmail({ name: 'Giulia Rossi', items: [{ listingTitle: 'Marine park snorkel' }], link: 'https://site.test/it/review/tripRequest/1?t=x', locale: 'it' });
    expect(subject).toBe('Com’è andato il tuo viaggio a Watamu?');
    expect(html).toContain('Ciao Giulia,');
    expect(html).toContain('Scrivi una recensione');
    const english = inviteEmail({ name: '', items: [], link: 'https://site.test/x' });
    expect(english.subject).toBe('How was your Watamu trip?');
    expect(english.html).toContain('Hi there,');
  });

  it('prefills WhatsApp messages in the traveller’s language', () => {
    expect(whatsapp.text.tripQuote('EW-ABC234', 'it')).toMatch(/^Ciao .+! Ho una domanda sul mio preventivo EW-ABC234\.$/);
    expect(whatsapp.text.tripQuote('EW-ABC234')).toMatch(/^Hi .+! I have a question about my quote EW-ABC234\.$/);
  });
});

describe('optional Italian listing text', () => {
  it('takes only the fields that were sent, trimmed, and keeps a blank to clear one', () => {
    expect(parseItalian({ titleIt: '  Snorkeling  ', descriptionIt: '', other: 'x' }, ITALIAN_FIELDS.tour)).toEqual({ titleIt: 'Snorkeling', descriptionIt: '' });
    expect(parseItalian({}, ITALIAN_FIELDS.group)).toEqual({});
  });
});
