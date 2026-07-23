'use strict';

const { sendMail } = require('./mailer');
const { buildQuotationPdf, buildReceiptPdf } = require('./documents');
const config = require('../config/env');

function money(n) {
  return 'KES ' + Number(n || 0).toLocaleString('en-KE');
}

// New booking request: notify the traveller (with quotation) and the admin.
async function notifyBookingRequested(booking, trip) {
  const pdf = await buildQuotationPdf(booking, trip);
  const attachment = { filename: `quotation-${booking._id}.pdf`, content: pdf };

  await sendMail({
    to: booking.email,
    subject: `We received your booking request - ${trip.title}`,
    html: `<p>Hi ${booking.fullName},</p>
      <p>Thanks for requesting a spot on <strong>${trip.title}</strong>. Your request is
      <strong>pending confirmation</strong> - our team will be in touch shortly to finalise it.</p>
      <p>Your quotation is attached.</p>
      <p>- ${config.brand.name}</p>`,
    attachments: [attachment],
  });

  await sendMail({
    to: config.adminNotifyEmail,
    subject: `New booking request - ${trip.title} (${booking.fullName})`,
    html: `<p>New <strong>pending</strong> booking request:</p>
      <ul>
        <li>Trip: ${trip.title}</li>
        <li>Traveller: ${booking.fullName} (${booking.email}, ${booking.phone})</li>
        <li>Payment type: ${booking.paymentType}</li>
        <li>Amount due now: ${money(booking.amountPaid)}</li>
        <li>Vibe: ${(booking.travelPersonalities || []).join(', ')} &middot; ${booking.travelGroup || ''}</li>
      </ul>
      <p>Confirm or cancel it in the admin portal.</p>`,
    attachments: [attachment],
  });
}

// Booking confirmed by admin: send the traveller a receipt.
async function notifyBookingConfirmed(booking, trip) {
  const pdf = await buildReceiptPdf(booking, trip);
  await sendMail({
    to: booking.email,
    subject: `Booking confirmed - ${trip.title}`,
    html: `<p>Hi ${booking.fullName},</p>
      <p>Your booking for <strong>${trip.title}</strong> is <strong>confirmed</strong>.
      Your receipt is attached.</p>
      <p>See you in Watamu!<br/>- ${config.brand.name}</p>`,
    attachments: [{ filename: `receipt-${booking._id}.pdf`, content: pdf }],
  });
}

// Booking cancelled by admin.
async function notifyBookingCancelled(booking, trip) {
  await sendMail({
    to: booking.email,
    subject: `Booking cancelled - ${trip ? trip.title : 'your trip'}`,
    html: `<p>Hi ${booking.fullName},</p>
      <p>Your booking${trip ? ` for <strong>${trip.title}</strong>` : ''} has been cancelled.
      If this was a mistake or you'd like to rebook, just reply to this email.</p>
      <p>- ${config.brand.name}</p>`,
  });
}

module.exports = { notifyBookingRequested, notifyBookingConfirmed, notifyBookingCancelled };
