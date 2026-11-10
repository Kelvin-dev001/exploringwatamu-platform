'use strict';

const config = require('../../config/env');

// Which channels a just-triggered notification can actually reach on this
// server. Sends are fire-and-forget, so responses carry this instead, letting
// the admin UI say "emailed" only when email is really set up.
function deliveryFor({ email, phone } = {}) {
  return {
    email: Boolean(email) && config.mail.enabled,
    sms: Boolean(phone) && config.sms.enabled,
  };
}

module.exports = { deliveryFor };
