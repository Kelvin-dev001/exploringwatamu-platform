'use strict';

// WhatsApp click-to-chat for emails and PDFs. Links only: nothing here sends a
// message. The traveller opens WhatsApp, reads the prefilled text, can change
// it, and decides whether to press Send. While WHATSAPP_NUMBER is unset (or
// unusable) every helper returns '' / null and the emails simply leave the
// WhatsApp option out.

const config = require('../config/env');
const escapeHtml = require('./escapeHtml');
const { formatWhatsAppNumber, whatsappLink } = require('../utils/whatsappNumber');

const enabled = () => Boolean(config.whatsapp.number);

// Prefilled first lines. They name the reference so the team can find the
// request straight away; the traveller adds their question in WhatsApp.
const text = {
  tripRequest: (reference) => `Hi ${config.brand.name}! I have a question about my trip request ${reference}.`,
  tripQuote: (reference) => `Hi ${config.brand.name}! I have a question about my quote ${reference}.`,
  groupBooking: (booking, trip) =>
    `Hi ${config.brand.name}! I have a question about my booking${trip?.title ? ` for "${trip.title}"` : ''} (reference ${booking._id}).`,
};

/** wa.me link to the business with a prefilled message, or null. */
const businessLink = (message) => whatsappLink(config.whatsapp.number, message);

/** The business number for people to read ("+254 712 345 678"), or ''. */
const businessNumber = () => formatWhatsAppNumber(config.whatsapp.number);

/**
 * A short paragraph with a "Chat on WhatsApp" button and the number written
 * out (for email clients that strip buttons, and people on a computer).
 * `lead` and `text` are plain text; both are escaped/encoded here.
 */
function emailBlock({ lead, text }) {
  const href = businessLink(text);
  if (!href) return '';
  return `<p style="margin:20px 0 8px;">${escapeHtml(lead)}</p>
  <p style="margin:0 0 20px;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#0b6e3b;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Chat on WhatsApp</a>
    <span style="color:#555555;font-size:13px;">&nbsp;or message us on ${escapeHtml(businessNumber())}</span>
  </p>`;
}

/** "WhatsApp: +254 …" under a PDF's contact line, as a link. Nothing without a number. */
function pdfLine(doc, message) {
  const href = businessLink(message);
  if (!href) return;
  doc.fontSize(9).fillColor('#0b6e3b').text(`WhatsApp: ${businessNumber()}`, { link: href, underline: true });
}

module.exports = { enabled, businessLink, businessNumber, emailBlock, pdfLine, text };
