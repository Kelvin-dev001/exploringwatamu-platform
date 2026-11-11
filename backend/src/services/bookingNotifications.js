'use strict';

const { sendMail } = require('./mailer');
const { sendSms } = require('./notifications/sms');
const { wrap } = require('./notifications/emailLayout');
const { buildQuotationPdf, buildReceiptPdf } = require('./documents');
const escapeHtml = require('./escapeHtml');
const logger = require('./logger');
const config = require('../config/env');

function money(n) {
  return 'KES ' + Number(n || 0).toLocaleString('en-KE');
}

// Names, contact details and vibe answers are typed by travellers: escape them
// before they go into email HTML (SMS text is plain and needs no escaping).
const html = (booking, trip) => ({
  name: escapeHtml(booking.fullName),
  email: escapeHtml(booking.email),
  phone: escapeHtml(booking.phone),
  paymentType: escapeHtml(booking.paymentType),
  vibe: escapeHtml((booking.travelPersonalities || []).join(', ')),
  group: escapeHtml(booking.travelGroup || ''),
  trip: escapeHtml(trip ? trip.title : ''),
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
  const pdf = await buildQuotationPdf(booking, trip);
  const attachment = { filename: `quotation-${booking._id}.pdf`, content: pdf };
  const h = html(booking, trip);

  await sendMail({
    to: booking.email,
    event: 'booking_requested',
    user: booking.user,
    subject: `We received your booking request - ${trip.title}`,
    html: wrap('Request received', `<p>Hi ${h.name},</p>
      <p>Thanks for requesting a spot on <strong>${h.trip}</strong>. Your request is
      <strong>pending confirmation</strong> — our team will be in touch shortly to finalise it.</p>
      <p>Your quotation is attached.</p>`),
    attachments: [attachment],
  });

  await sendMail({
    to: config.adminNotifyEmail,
    event: 'booking_requested_admin',
    subject: `New booking request - ${trip.title} (${booking.fullName})`,
    html: wrap('New booking request', `<ul>
        <li>Trip: ${h.trip}</li>
        <li>Traveller: ${h.name} (${h.email}, ${h.phone})</li>
        <li>Payment type: ${h.paymentType}</li>
        <li>Amount due now: ${money(booking.amountPaid)}</li>
        <li>Vibe: ${h.vibe} &middot; ${h.group}</li>
      </ul>
      <p>Confirm or cancel it in the admin portal.</p>`),
    attachments: [attachment],
  });

  await trySms({
    to: booking.phone,
    user: booking.user,
    event: 'booking_requested',
    message: `Hi ${booking.fullName}, we received your request for ${trip.title}. It's pending confirmation — we'll be in touch. - ${config.brand.name}`,
  });
}

// Booking confirmed by admin: receipt email + SMS.
async function notifyBookingConfirmed(booking, trip) {
  const pdf = await buildReceiptPdf(booking, trip);
  const h = html(booking, trip);
  await sendMail({
    to: booking.email,
    event: 'booking_confirmed',
    user: booking.user,
    subject: `Booking confirmed - ${trip.title}`,
    html: wrap('Booking confirmed', `<p>Hi ${h.name},</p>
      <p>Your booking for <strong>${h.trip}</strong> is <strong>confirmed</strong>. Your receipt is attached.</p>
      <p>See you in Watamu!</p>`),
    attachments: [{ filename: `receipt-${booking._id}.pdf`, content: pdf }],
  });

  await trySms({
    to: booking.phone,
    user: booking.user,
    event: 'booking_confirmed',
    message: `Great news ${booking.fullName}! Your ${trip.title} booking is CONFIRMED. See you in Watamu. - ${config.brand.name}`,
  });
}

// Booking cancelled by admin.
async function notifyBookingCancelled(booking, trip) {
  const h = html(booking, trip);
  await sendMail({
    to: booking.email,
    event: 'booking_cancelled',
    user: booking.user,
    subject: `Booking cancelled - ${trip ? trip.title : 'your trip'}`,
    html: wrap('Booking cancelled', `<p>Hi ${h.name},</p>
      <p>Your booking${trip ? ` for <strong>${h.trip}</strong>` : ''} has been cancelled.
      If this was a mistake or you'd like to rebook, just reply to this email.</p>`),
  });

  await trySms({
    to: booking.phone,
    user: booking.user,
    event: 'booking_cancelled',
    message: `Hi ${booking.fullName}, your ${trip ? trip.title : 'trip'} booking was cancelled. Reply to rebook. - ${config.brand.name}`,
  });
}

module.exports = { notifyBookingRequested, notifyBookingConfirmed, notifyBookingCancelled };
