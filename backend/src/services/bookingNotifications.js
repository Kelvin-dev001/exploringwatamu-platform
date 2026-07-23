'use strict';

const { sendMail } = require('./mailer');
const { sendSms } = require('./notifications/sms');
const { wrap } = require('./notifications/emailLayout');
const { buildQuotationPdf, buildReceiptPdf } = require('./documents');
const config = require('../config/env');

function money(n) {
  return 'KES ' + Number(n || 0).toLocaleString('en-KE');
}

// SMS is best-effort: a failure must not break the email or the booking.
async function trySms(args) {
  try {
    await sendSms(args);
  } catch (err) {
    console.error('[sms]', err.message);
  }
}

// New booking request: quotation to the traveller, notification to admin, SMS ack.
async function notifyBookingRequested(booking, trip) {
  const pdf = await buildQuotationPdf(booking, trip);
  const attachment = { filename: `quotation-${booking._id}.pdf`, content: pdf };

  await sendMail({
    to: booking.email,
    event: 'booking_requested',
    user: booking.user,
    subject: `We received your booking request - ${trip.title}`,
    html: wrap('Request received', `<p>Hi ${booking.fullName},</p>
      <p>Thanks for requesting a spot on <strong>${trip.title}</strong>. Your request is
      <strong>pending confirmation</strong> — our team will be in touch shortly to finalise it.</p>
      <p>Your quotation is attached.</p>`),
    attachments: [attachment],
  });

  await sendMail({
    to: config.adminNotifyEmail,
    event: 'booking_requested_admin',
    subject: `New booking request - ${trip.title} (${booking.fullName})`,
    html: wrap('New booking request', `<ul>
        <li>Trip: ${trip.title}</li>
        <li>Traveller: ${booking.fullName} (${booking.email}, ${booking.phone})</li>
        <li>Payment type: ${booking.paymentType}</li>
        <li>Amount due now: ${money(booking.amountPaid)}</li>
        <li>Vibe: ${(booking.travelPersonalities || []).join(', ')} &middot; ${booking.travelGroup || ''}</li>
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
  await sendMail({
    to: booking.email,
    event: 'booking_confirmed',
    user: booking.user,
    subject: `Booking confirmed - ${trip.title}`,
    html: wrap('Booking confirmed', `<p>Hi ${booking.fullName},</p>
      <p>Your booking for <strong>${trip.title}</strong> is <strong>confirmed</strong>. Your receipt is attached.</p>
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
  await sendMail({
    to: booking.email,
    event: 'booking_cancelled',
    user: booking.user,
    subject: `Booking cancelled - ${trip ? trip.title : 'your trip'}`,
    html: wrap('Booking cancelled', `<p>Hi ${booking.fullName},</p>
      <p>Your booking${trip ? ` for <strong>${trip.title}</strong>` : ''} has been cancelled.
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
