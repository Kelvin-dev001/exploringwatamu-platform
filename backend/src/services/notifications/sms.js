'use strict';

const axios = require('axios');
const config = require('../../config/env');
const logger = require('../logger');
const { record } = require('./log');

// Sends an SMS via Africa's Talking. When credentials are unset it is a safe
// no-op (logged), so nothing breaks in dev/staging. Never blocks a booking.
async function sendSms({ to, message, user = null, event = null } = {}) {
  if (!to || !message) return { skipped: true, reason: 'missing to/message' };

  const { username, apiKey, senderId, env } = config.sms;
  const subject = message.slice(0, 60);

  if (!config.sms.enabled) {
    logger.info('SMS NOT sent: SMS not configured', { event, to: logger.maskPhone(to) });
    await record({ user, channel: 'sms', event, to, subject, status: 'skipped' });
    return { skipped: true };
  }

  const host = env === 'sandbox' ? 'https://api.sandbox.africastalking.com' : 'https://api.africastalking.com';
  const params = new URLSearchParams({ username, to, message });
  if (senderId) params.append('from', senderId);

  try {
    const res = await axios.post(`${host}/version1/messaging`, params.toString(), {
      headers: {
        apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      timeout: 15000,
    });
    await record({ user, channel: 'sms', event, to, subject, status: 'sent', meta: res.data });
    return res.data;
  } catch (err) {
    logger.error('SMS failed', { event, to: logger.maskPhone(to), ...logger.errorFields(err) });
    await record({ user, channel: 'sms', event, to, subject, status: 'failed', error: err.message });
    throw err;
  }
}

module.exports = { sendSms };
