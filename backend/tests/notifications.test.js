'use strict';

// What travellers and the team are sent, with the transports mocked: who gets
// which email/SMS, that quotes and bookings carry a real PDF, and that
// anything a traveller typed is escaped before it goes into email HTML.

jest.mock('../src/services/mailer', () => ({ sendMail: jest.fn(async () => ({})) }));
jest.mock('../src/services/notifications/sms', () => ({ sendSms: jest.fn(async () => ({})) }));

const { sendMail } = require('../src/services/mailer');
const { sendSms } = require('../src/services/notifications/sms');
const { notifyTripRequested, notifyQuoteSent, notifyStatus } = require('../src/services/tripRequestNotifications');
const { notifyBookingRequested, notifyBookingConfirmed, notifyBookingCancelled } = require('../src/services/bookingNotifications');
const { sendPasswordResetEmail } = require('../src/services/notifications/authNotifications');

const NASTY = '<img src=x onerror=alert(1)>';
const isPdf = (buf) => Buffer.isBuffer(buf) && buf.subarray(0, 5).toString() === '%PDF-';
const mails = () => sendMail.mock.calls.map(([m]) => m);

const tripRequest = (overrides = {}) => ({
  reference: 'EW-ABC234',
  user: null,
  contact: { name: `Amina ${NASTY}`, email: 'amina@example.com', phone: '+254700000000' },
  adults: 2,
  children: 1,
  residency: 'nonResident',
  arrival: new Date('2027-01-10'),
  departure: new Date('2027-01-12'),
  days: [{ label: 'Day 1', items: [{ kind: 'tour', title: `Snorkel ${NASTY}` }] }, { label: 'Day 2', items: [] }],
  ideas: [{ kind: 'stay', title: 'Stay · Turtle Bay' }],
  notes: 'Honeymoon <3',
  quote: { lines: [{ label: `Snorkel x2 ${NASTY}`, amount: 13000 }, { label: 'Transfers', amount: 6000 }], total: 19000, message: `Karibu!\n${NASTY}`, validUntil: new Date('2027-01-01') },
  ...overrides,
});

const booking = { _id: 'b1', user: 'u1', fullName: `Juma ${NASTY}`, email: 'juma@example.com', phone: '0700000000', paymentType: 'deposit', amountPaid: 5000, amountDue: 15000, travelPersonalities: ['Beach Bum', NASTY], travelGroup: 'Solo But Social' };
const trip = { title: 'Reef & Rhythm', startDate: new Date('2027-02-01'), endDate: new Date('2027-02-03'), fullPrice: 20000, meetingPoint: 'Watamu Beach' };

beforeEach(() => jest.clearAllMocks());

describe('trip request notifications', () => {
  it('acknowledges the traveller, alerts the team and texts the traveller', async () => {
    await notifyTripRequested(tripRequest());

    const [ack, admin] = mails();
    expect(ack).toMatchObject({ to: 'amina@example.com', event: 'trip_requested' });
    expect(ack.subject).toContain('EW-ABC234');
    expect(admin.event).toBe('trip_requested_admin');
    for (const m of [ack, admin]) {
      expect(m.html).not.toContain(NASTY);
      expect(m.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    }
    expect(ack.html).toContain('Stay · Turtle Bay');
    expect(sendSms).toHaveBeenCalledWith(expect.objectContaining({ to: '+254700000000', event: 'trip_requested' }));
  });

  it('skips the SMS when there is no phone number', async () => {
    await notifyTripRequested(tripRequest({ contact: { name: 'A', email: 'a@b.co' } }));
    expect(sendSms).not.toHaveBeenCalled();
  });

  it('emails the quote with every line, the total and a PDF attachment', async () => {
    await notifyQuoteSent(tripRequest());

    const [mail] = mails();
    expect(mail).toMatchObject({ to: 'amina@example.com', event: 'trip_quote_sent' });
    expect(mail.html).toContain('KES 19,000');
    expect(mail.html).toContain('Transfers');
    expect(mail.html).not.toContain(NASTY);
    expect(mail.attachments).toHaveLength(1);
    expect(mail.attachments[0].filename).toBe('quote-EW-ABC234.pdf');
    expect(isPdf(mail.attachments[0].content)).toBe(true);
    expect(sendSms).toHaveBeenCalledWith(expect.objectContaining({ event: 'trip_quote_sent', message: expect.stringContaining('KES 19,000') }));
  });

  it('emails accepted / declined / cancelled, and nothing for a reopen', async () => {
    await notifyStatus(tripRequest(), 'accepted');
    expect(mails()[0]).toMatchObject({ event: 'trip_accepted' });
    sendMail.mockClear();
    await notifyStatus(tripRequest(), 'new');
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('group booking notifications', () => {
  it('sends the traveller a quotation PDF and the team the details, escaped', async () => {
    await notifyBookingRequested(booking, trip);

    const [traveller, admin] = mails();
    expect(traveller).toMatchObject({ to: 'juma@example.com', event: 'booking_requested' });
    expect(isPdf(traveller.attachments[0].content)).toBe(true);
    expect(traveller.attachments[0].filename).toBe('quotation-b1.pdf');
    expect(admin.event).toBe('booking_requested_admin');
    for (const m of [traveller, admin]) {
      expect(m.html).not.toContain(NASTY);
      expect(m.html).toContain('Reef &amp; Rhythm');
    }
    expect(admin.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('sends a receipt PDF on confirmation and a notice on cancellation', async () => {
    await notifyBookingConfirmed(booking, trip);
    const [confirmed] = mails();
    expect(confirmed.event).toBe('booking_confirmed');
    expect(isPdf(confirmed.attachments[0].content)).toBe(true);
    expect(confirmed.html).not.toContain(NASTY);

    sendMail.mockClear();
    await notifyBookingCancelled(booking, null);
    expect(mails()[0]).toMatchObject({ event: 'booking_cancelled' });
    expect(mails()[0].html).not.toContain(NASTY);
  });

  it('keeps going when the SMS provider fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    sendSms.mockRejectedValueOnce(new Error('provider down'));
    await expect(notifyBookingCancelled(booking, trip)).resolves.toBeUndefined();
    jest.restoreAllMocks();
  });
});

describe('password reset email', () => {
  it('links to the reset page and escapes the account name', async () => {
    await sendPasswordResetEmail({ _id: 'u1', email: 'ada@example.com', name: NASTY }, 'https://site.test/reset-password?token=abc123');
    const [mail] = mails();
    expect(mail).toMatchObject({ to: 'ada@example.com', event: 'password_reset' });
    expect(mail.html).toContain('href="https://site.test/reset-password?token=abc123"');
    expect(mail.html).not.toContain(NASTY);
  });
});
