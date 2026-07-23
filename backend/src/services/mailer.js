'use strict';

const config = require('../config/env');

let transporter = null;

// Build a transporter once. Uses real SMTP when configured; otherwise a
// jsonTransport that does not actually send (safe for local dev / tests).
// nodemailer is required lazily so the app still boots if it isn't installed.
function getTransporter() {
  if (transporter) return transporter;
  const nodemailer = require('nodemailer');

  if (config.mail.host && config.mail.user) {
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

async function sendMail({ to, subject, html, text, attachments } = {}) {
  if (!to) return { skipped: true, reason: 'no recipient' };
  const info = await getTransporter().sendMail({
    from: config.mail.from,
    to,
    subject,
    html,
    text,
    attachments,
  });
  if (!config.mail.host) {
    console.log(`[mailer] SMTP not configured — email NOT sent. to=${to} subject="${subject}"`);
  }
  return info;
}

module.exports = { sendMail, getTransporter };
