'use strict';

const { sendMail } = require('./mailer');
const { wrap } = require('./notifications/emailLayout');
const escapeHtml = require('./escapeHtml');
const config = require('../config/env');

/*
 * Review emails. English only for now: the platform has no traveller language
 * setting yet (Phase 6 adds Italian; these templates take a `locale` then).
 */

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

/** Tell the team a new review is waiting (fire-and-forget from the controller). */
async function notifyReviewSubmitted(review) {
  if (!config.adminNotifyEmail) return;
  await sendMail({
    to: config.adminNotifyEmail,
    event: 'review_submitted_admin',
    subject: `New review to check: ${review.listingTitle || review.listingType} (${review.rating}/5)`,
    html: wrap(
      'A new review is waiting',
      `<p><strong>${escapeHtml(review.listingTitle || review.listingType)}</strong> · ${stars(review.rating)}</p>
      <p style="white-space:pre-line">${escapeHtml(review.text)}</p>
      <p>— ${escapeHtml(review.displayName)}${review.booking?.reference ? ` (${escapeHtml(review.booking.reference)})` : ''}</p>
      <p>It isn’t public yet. Approve or hide it in the admin portal under <strong>Reviews</strong>.</p>`
    ),
  });
}

/** The post-trip invitation (sent by the review-invite job). */
function inviteEmail({ name, items, link }) {
  const first = String(name || '').trim().split(/\s+/)[0];
  const list = items.map((i) => `<li>${escapeHtml(i.listingTitle)}</li>`).join('');
  return {
    subject: 'How was your Watamu trip?',
    html: wrap(
      'How was your Watamu trip?',
      `<p>Hi ${escapeHtml(first) || 'there'},</p>
      <p>We hope you had a wonderful time. Would you tell other travellers what it was like? It takes a minute, and it helps us a lot.</p>
      <ul style="margin:0 0 16px;padding-left:18px">${list}</ul>
      <p style="margin:20px 0;"><a href="${escapeHtml(link)}" style="background:#0b2642;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Write a review</a></p>
      <p style="font-size:12px;color:#888888;">Your review appears on our website once our team has checked it. If the button doesn’t work, paste this link: ${escapeHtml(link)}</p>`
    ),
  };
}

module.exports = { notifyReviewSubmitted, inviteEmail };
