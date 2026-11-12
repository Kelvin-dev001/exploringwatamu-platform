'use strict';

const { sendMail } = require('./mailer');
const { sendSms } = require('./notifications/sms');
const { wrap } = require('./notifications/emailLayout');
const { buildQuotationPdf, buildReceiptPdf } = require('./documents');
const whatsapp = require('./whatsapp');
const escapeHtml = require('./escapeHtml');
const logger = require('./logger');
const config = require('../config/env');
const i18n = require('../i18n');

function money(n) {
  return i18n.money(n, 'en');
}

// The traveller's emails and texts are in the language they booked in
// (booking.locale, English when missing); the team's stay English.
const tripTitle = (trip, locale) => (trip ? (locale === 'it' && trip.titleIt?.trim()) || trip.title : '');

// Names, contact details and vibe answers are typed by travellers: escape them
// before they go into email HTML (SMS text is plain and needs no escaping).
const html = (booking, trip, locale = 'en') => ({
  name: escapeHtml(booking.fullName),
  email: escapeHtml(booking.email),
  phone: escapeHtml(booking.phone),
  paymentType: escapeHtml(booking.paymentType),
  vibe: escapeHtml((booking.travelPersonalities || []).join(', ')),
  group: escapeHtml(booking.travelGroup || ''),
  trip: escapeHtml(tripTitle(trip, locale)),
});

// SMS is best-effort: a failure must not break the email or the booking.
async function trySms(args) {
  try {
    await sendSms(args);
  } catch (err) {
    logger.error('booking SMS failed', { event: args.event, ...logger.errorFields(err) });
  }
}

// New booking request: quotation to the traveller, notification to admin, SMS ack.
async function notifyBookingRequested(booking, trip) {
  const L = i18n.forLocale(booking.locale);
  const travellerPdf = await buildQuotationPdf(booking, trip);
  const teamPdf = L.locale === 'en' ? travellerPdf : await buildQuotationPdf({ ...(booking.toObject ? booking.toObject() : booking), locale: 'en' }, trip);
  const h = html(booking, trip, L.locale);
  const title = tripTitle(trip, L.locale);

  await sendMail({
    to: booking.email,
    event: 'booking_requested',
    user: booking.user,
    subject: L.t('bookingSubject', { trip: title }),
    html: wrap(L.t('bookingTitle'), `<p>${L.t('hi', { name: h.name })}</p>
      <p>${L.t('bookingBody', { trip: h.trip })}</p>
      <p>${escapeHtml(L.t('bookingAttached'))}</p>
      ${whatsapp.emailBlock({ lead: L.t('bookingWhatsApp'), text: whatsapp.text.groupBooking(booking, { title }, L.locale), locale: L.locale })}`, L.locale),
    attachments: [{ filename: `quotation-${booking._id}.pdf`, content: travellerPdf }],
  });

  const team = html(booking, trip);
  await sendMail({
    to: config.adminNotifyEmail,
    event: 'booking_requested_admin',
    subject: `New booking request - ${trip.title} (${booking.fullName})`,
    html: wrap('New booking request', `<ul>
        <li>Trip: ${team.trip}</li>
        <li>Traveller: ${team.name} (${team.email}, ${team.phone})</li>
        ${L.locale !== 'en' ? '<li>Language: Italian — their emails and quotation are in Italian</li>' : ''}
        <li>Payment type: ${team.paymentType}</li>
        <li>Amount due now: ${money(booking.amountPaid)}</li>
        <li>Vibe: ${team.vibe} &middot; ${team.group}</li>
      </ul>
      <p>Confirm or cancel it in the admin portal.</p>`),
    attachments: [{ filename: `quotation-${booking._id}.pdf`, content: teamPdf }],
  });

  await trySms({
    to: booking.phone,
    user: booking.user,
    event: 'booking_requested',
    message: L.t('bookingSms', { name: booking.fullName, trip: title, brand: config.brand.name }),
  });
}

// Booking confirmed by admin: receipt email + SMS.
async function notifyBookingConfirmed(booking, trip) {
  const L = i18n.forLocale(booking.locale);
  const pdf = await buildReceiptPdf(booking, trip);
  const h = html(booking, trip, L.locale);
  const title = tripTitle(trip, L.locale);
  await sendMail({
    to: booking.email,
    event: 'booking_confirmed',
    user: booking.user,
    subject: L.t('confirmedSubject', { trip: title }),
    html: wrap(L.t('confirmedTitle'), `<p>${L.t('hi', { name: h.name })}</p>
      <p>${L.t('confirmedBody', { trip: h.trip })}</p>
      <p>${escapeHtml(L.t('confirmedSee'))}</p>`, L.locale),
    attachments: [{ filename: `receipt-${booking._id}.pdf`, content: pdf }],
  });

  await trySms({
    to: booking.phone,
    user: booking.user,
    event: 'booking_confirmed',
    message: L.t('confirmedSms', { name: booking.fullName, trip: title, brand: config.brand.name }),
  });
}

// Booking cancelled by admin.
async function notifyBookingCancelled(booking, trip) {
  const L = i18n.forLocale(booking.locale);
  const h = html(booking, trip, L.locale);
  const title = tripTitle(trip, L.locale);
  await sendMail({
    to: booking.email,
    event: 'booking_cancelled',
    user: booking.user,
    subject: L.t('cancelSubject', { trip: trip ? title : L.t('cancelYourTrip') }),
    html: wrap(L.t('cancelTitle'), `<p>${L.t('hi', { name: h.name })}</p>
      <p>${L.t('cancelBody', { forTrip: trip ? L.t('cancelForTrip', { trip: h.trip }) : '' })}</p>`, L.locale),
  });

  await trySms({
    to: booking.phone,
    user: booking.user,
    event: 'booking_cancelled',
    message: L.t('cancelSms', { name: booking.fullName, trip: trip ? title : L.t('cancelTripWord'), brand: config.brand.name }),
  });
}

module.exports = { notifyBookingRequested, notifyBookingConfirmed, notifyBookingCancelled };
