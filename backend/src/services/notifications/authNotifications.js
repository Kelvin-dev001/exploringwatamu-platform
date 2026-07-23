'use strict';

const { sendMail } = require('../mailer');
const { wrap } = require('./emailLayout');
const config = require('../../config/env');

async function sendPasswordResetEmail(user, resetUrl) {
  await sendMail({
    to: user.email,
    event: 'password_reset',
    user: user._id,
    subject: `Reset your ${config.brand.name} password`,
    html: wrap('Reset your password', `<p>Hi ${user.name || ''},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.
      This link expires in ${config.resetTokenTtlMinutes} minutes.</p>
      <p style="margin:20px 0;">
        <a href="${resetUrl}" style="background:#24b3b3;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;">Reset password</a>
      </p>
      <p style="font-size:12px;color:#888888;">If you didn't request this, you can safely ignore this email.<br/>Or paste this link: ${resetUrl}</p>`),
  });
}

module.exports = { sendPasswordResetEmail };
