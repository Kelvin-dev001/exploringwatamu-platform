'use strict';

const config = require('../../config/env');
const { translate } = require('../../i18n');
const { normaliseLocale } = require('../../constants/locales');

// Wraps email body HTML in a consistent, branded shell so every email looks
// the same. Pass a title (optional), the inner HTML and, for a traveller's
// email, their language (the footer follows it; lang tells mail apps and
// screen readers how to read it). Team emails leave it out: English.
function wrap(title, bodyHtml, locale = 'en') {
  const lang = normaliseLocale(locale);
  const footer = translate(lang, 'questions', { email: config.brand.supportEmail, brand: config.brand.name }).replace(' · ', ' &middot; ');
  return `<div lang="${lang}" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
  <div style="background:#0b2642;padding:16px 24px;">
    <h1 style="margin:0;font-size:20px;color:#ffffff;">${config.brand.name}</h1>
  </div>
  <div style="padding:24px;color:#333333;line-height:1.6;font-size:14px;">
    ${title ? `<h2 style="color:#215a75;font-size:18px;margin:0 0 12px;">${title}</h2>` : ''}
    ${bodyHtml}
  </div>
  <div style="padding:16px 24px;color:#888888;font-size:12px;border-top:1px solid #eeeeee;">
    ${footer}
  </div>
</div>`;
}

module.exports = { wrap };
