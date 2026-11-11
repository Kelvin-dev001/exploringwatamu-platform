'use strict';

const { sendMail } = require('./mailer');
const { wrap } = require('./notifications/emailLayout');
const escapeHtml = require('./escapeHtml');
const config = require('../config/env');
const i18n = require('../i18n');

/*
 * Review emails. The team's notice is English; the traveller's invitation is
 * in the language they booked in (English when unknown).
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

/** The post-trip invitation (sent by the review-invite job), in the traveller's language. */
function inviteEmail({ name, items, link, locale = 'en' }) {
  const L = i18n.forLocale(locale);
  const first = String(name || '').trim().split(/\s+/)[0];
  const list = items.map((i) => `<li>${escapeHtml(i.listingTitle)}</li>`).join('');
  const greeting = escapeHtml(first) || L.t('hiThere');
  return {
    subject: L.t('inviteSubject'),
    html: wrap(
      L.t('inviteSubject'),
      `<p>${greeting ? L.t('hi', { name: greeting }) : L.t('hi', { name: '' }).replace(' ,', ',')}</p>
      <p>${escapeHtml(L.t('inviteBody'))}</p>
      <ul style="margin:0 0 16px;padding-left:18px">${list}</ul>
      <p style="margin:20px 0;"><a href="${escapeHtml(link)}" style="background:#0b2642;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">${escapeHtml(L.t('inviteButton'))}</a></p>
      <p style="font-size:12px;color:#888888;">${L.t('inviteNote', { link: escapeHtml(link) })}</p>`,
      L.locale
    ),
  };
}

module.exports = { notifyReviewSubmitted, inviteEmail };
