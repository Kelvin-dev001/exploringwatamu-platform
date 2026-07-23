'use strict';

const config = require('../../config/env');

// Wraps email body HTML in a consistent, branded shell so every email looks
// the same. Pass a title (optional) and the inner HTML.
function wrap(title, bodyHtml) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
  <div style="background:#0b7285;padding:16px 24px;">
    <h1 style="margin:0;font-size:20px;color:#ffffff;">${config.brand.name}</h1>
  </div>
  <div style="padding:24px;color:#333333;line-height:1.6;font-size:14px;">
    ${title ? `<h2 style="color:#1e7575;font-size:18px;margin:0 0 12px;">${title}</h2>` : ''}
    ${bodyHtml}
  </div>
  <div style="padding:16px 24px;color:#888888;font-size:12px;border-top:1px solid #eeeeee;">
    Questions? ${config.brand.supportEmail} &middot; ${config.brand.name}, Watamu, Kenya
  </div>
</div>`;
}

module.exports = { wrap };
