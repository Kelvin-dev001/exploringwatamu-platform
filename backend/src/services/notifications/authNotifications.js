'use strict';

const { sendMail } = require('../mailer');
const { wrap } = require('./emailLayout');
const escapeHtml = require('../escapeHtml');
const config = require('../../config/env');
const i18n = require('../../i18n');
const { VERIFY_TOKEN_TTL_HOURS } = require('../emailVerification');

/** The reset email, in the language the request came from (the website sends it; English otherwise). */
async function sendPasswordResetEmail(user, resetUrl, locale = 'en') {
  const L = i18n.forLocale(locale);
  const link = escapeHtml(resetUrl);
  await sendMail({
    to: user.email,
    event: 'password_reset',
    user: user._id,
    subject: L.t('resetSubject', { brand: config.brand.name }),
    html: wrap(L.t('resetTitle'), `<p>${L.t('hi', { name: escapeHtml(user.name || '') })}</p>
      <p>${escapeHtml(L.t('resetBody', { minutes: config.resetTokenTtlMinutes }))}</p>
      <p style="margin:20px 0;">
        <a href="${link}" style="background:#24b3b3;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">${escapeHtml(L.t('resetButton'))}</a>
      </p>
      <p style="font-size:12px;color:#888888;">${escapeHtml(L.t('resetIgnore'))}<br/>${L.t('resetPaste', { link })}</p>`, L.locale),
  });
}

/** "Confirm your email address", in the language the account was created in. */
async function sendVerificationEmail(user, verifyUrl, locale = 'en') {
  const L = i18n.forLocale(locale);
  const link = escapeHtml(verifyUrl);
  await sendMail({
    to: user.email,
    event: 'email_verification',
    user: user._id,
    subject: L.t('verifySubject', { brand: config.brand.name }),
    html: wrap(L.t('verifyTitle'), `<p>${L.t('hi', { name: escapeHtml(user.name || '') })}</p>
      <p>${escapeHtml(L.t('verifyBody', { hours: VERIFY_TOKEN_TTL_HOURS }))}</p>
      <p style="margin:20px 0;">
        <a href="${link}" style="background:#24b3b3;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">${escapeHtml(L.t('verifyButton'))}</a>
      </p>
      <p style="font-size:12px;color:#888888;">${escapeHtml(L.t('verifyIgnore'))}<br/>${L.t('resetPaste', { link })}</p>`, L.locale),
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
