'use strict';

const config = require('../config/env');
const logger = require('./logger');
const { record } = require('./notifications/log');

let transporter = null;

// Build a transporter once. Uses real SMTP when configured; otherwise a
// jsonTransport that does not actually send (safe for local dev / tests).
// nodemailer is required lazily so the app still boots if it isn't installed.
function getTransporter() {
  if (transporter) return transporter;
  const nodemailer = require('nodemailer');

  if (config.mail.enabled) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: { user: config.mail.user, pass: config.mail.pass },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text, attachments, event = null, user = null } = {}) {
  if (!to) return { skipped: true, reason: 'no recipient' };
  try {
    const info = await getTransporter().sendMail({
      from: config.mail.from,
      to,
      subject,
      html,
      text,
      attachments,
    });
    // Same test as the transport choice above, so the audit log never says
    // "sent" for a message the dev transport only serialized.
    if (!config.mail.enabled) {
      // No subject: some carry the traveller's name. The Notification log has the details.
      logger.info('email NOT sent: SMTP not configured', { event, to: logger.maskEmail(to) });
    }
    await record({ user, channel: 'email', event, to, subject, status: config.mail.enabled ? 'sent' : 'skipped' });
    return info;
  } catch (err) {
    logger.error('email failed', { event, to: logger.maskEmail(to), ...logger.errorFields(err) });
    await record({ user, channel: 'email', event, to, subject, status: 'failed', error: err.message });
    throw err;
  }
}

module.exports = { sendMail, getTransporter };
