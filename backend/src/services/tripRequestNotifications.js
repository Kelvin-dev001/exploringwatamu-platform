'use strict';

const { sendMail } = require('./mailer');
const { sendSms } = require('./notifications/sms');
const { wrap } = require('./notifications/emailLayout');
const { buildTripQuotePdf } = require('./documents');
const escapeHtml = require('./escapeHtml');
const config = require('../config/env');

// All sends are best-effort: callers fire these without awaiting, and a
// failed email/SMS must never fail the request itself.

const money = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');
const fmt = (d) => (d ? new Date(d).toDateString() : null);

function itineraryHtml(r) {
  const days = (r.days || [])
    .map((d, i) => {
      const items = d.items.length ? d.items.map((it) => `<li>${escapeHtml(it.title)}</li>`).join('') : '<li style="color:#888">Free day</li>';
      return `<p style="margin:12px 0 4px;font-weight:bold">${escapeHtml(d.label || `Day ${i + 1}`)}</p><ul style="margin:0;padding-left:18px">${items}</ul>`;
    })
    .join('');
  const ideas = (r.ideas || []).length
    ? `<p style="margin:12px 0 4px;font-weight:bold">Stays, extras &amp; unscheduled</p><ul style="margin:0;padding-left:18px">${r.ideas
        .map((it) => `<li>${escapeHtml(it.title)}</li>`)
        .join('')}</ul>`
    : '';
  return days + ideas;
}

function whoAndWhen(r) {
  const who = `${r.adults} adult${r.adults === 1 ? '' : 's'}${r.children ? `, ${r.children} child${r.children === 1 ? '' : 'ren'}` : ''}`;
  const when = r.arrival ? `${fmt(r.arrival)} – ${fmt(r.departure)}` : `${(r.days || []).length} days, dates flexible`;
  return `${who} · ${when}`;
}

async function safe(fn, label) {
  try {
    await fn();
  } catch (err) {
    console.error(`[trip-request:${label}]`, err.message);
  }
}

async function notifyTripRequested(r) {
  const name = escapeHtml(r.contact.name);
  await safe(
    () =>
      sendMail({
        to: r.contact.email,
        user: r.user,
        event: 'trip_requested',
        subject: `We’ve got your Watamu trip (${r.reference})`,
        html: wrap(
          'Your trip request is in',
          `<p>Hi ${name},</p>
          <p>Thanks for planning your trip with us. Our local team is checking availability and will email your
          personal quote soon. There’s nothing to pay yet.</p>
          <p><strong>Reference:</strong> ${r.reference}<br/><strong>Trip:</strong> ${escapeHtml(whoAndWhen(r))}</p>
          ${itineraryHtml(r)}
          ${r.notes ? `<p><strong>Your notes:</strong> ${escapeHtml(r.notes)}</p>` : ''}`
        ),
      }),
    'ack'
  );

  await safe(
    () =>
      sendMail({
        to: config.adminNotifyEmail,
        event: 'trip_requested_admin',
        subject: `New trip request ${r.reference} — ${r.contact.name}`,
        html: wrap(
          'New trip request',
          `<ul>
            <li>Traveller: ${name} (${escapeHtml(r.contact.email)}${r.contact.phone ? `, ${escapeHtml(r.contact.phone)}` : ''})</li>
            ${r.contact.country ? `<li>From: ${escapeHtml(r.contact.country)}</li>` : ''}
            <li>${escapeHtml(whoAndWhen(r))}</li>
            <li>Prices seen: ${r.residency === 'resident' ? 'Kenya resident' : 'visitor'}${r.estimate?.total ? ` · website estimate ${money(r.estimate.total)}` : ''}</li>
            ${r.profile?.vibes?.length ? `<li>Vibe: ${escapeHtml(r.profile.vibes.join(', '))}${r.profile.companions ? ` · ${escapeHtml(r.profile.companions)}` : ''}</li>` : ''}
          </ul>
          ${itineraryHtml(r)}
          ${r.notes ? `<p><strong>Notes:</strong> ${escapeHtml(r.notes)}</p>` : ''}
          <p>Price it in the admin portal under <strong>Trip requests</strong>.</p>`
        ),
      }),
    'admin'
  );

  if (r.contact.phone) {
    await safe(
      () =>
        sendSms({
          to: r.contact.phone,
          user: r.user,
          event: 'trip_requested',
          message: `Hi ${r.contact.name}, we received your Watamu trip request ${r.reference}. Your quote is on its way by email. - ${config.brand.name}`,
        }),
      'sms'
    );
  }
}

async function notifyQuoteSent(r) {
  const q = r.quote;
  let attachments;
  await safe(async () => {
    const pdf = await buildTripQuotePdf(r);
    attachments = [{ filename: `quote-${r.reference}.pdf`, content: pdf }];
  }, 'pdf');

  const lines = q.lines.map((l) => `<tr><td style="padding:4px 0">${escapeHtml(l.label)}</td><td style="padding:4px 0;text-align:right">${money(l.amount)}</td></tr>`).join('');
  await safe(
    () =>
      sendMail({
        to: r.contact.email,
        user: r.user,
        event: 'trip_quote_sent',
        subject: `Your Watamu trip quote (${r.reference})`,
        html: wrap(
          'Your quote is ready',
          `<p>Hi ${escapeHtml(r.contact.name)},</p>
          ${q.message ? `<p>${escapeHtml(q.message).replace(/\n/g, '<br/>')}</p>` : '<p>Here’s the price for your trip.</p>'}
          <table style="width:100%;border-collapse:collapse;margin:12px 0">${lines}
            <tr><td style="padding:8px 0;border-top:1px solid #eee;font-weight:bold">Total</td><td style="padding:8px 0;border-top:1px solid #eee;text-align:right;font-weight:bold">${money(q.total)}</td></tr>
          </table>
          ${q.validUntil ? `<p>This quote is valid until <strong>${fmt(q.validUntil)}</strong>.</p>` : ''}
          <p>To go ahead, just reply to this email. We’ll confirm each booking and how to pay.</p>
          <p><strong>Reference:</strong> ${r.reference}</p>`
        ),
        attachments,
      }),
    'quote'
  );

  if (r.contact.phone) {
    await safe(
      () =>
        sendSms({
          to: r.contact.phone,
          user: r.user,
          event: 'trip_quote_sent',
          message: `Your Watamu trip quote ${r.reference} is ready: ${money(q.total)}. Check your email for details. - ${config.brand.name}`,
        }),
      'quote-sms'
    );
  }
}

async function notifyStatus(r, status) {
  const copy = {
    accepted: ['Your trip is confirmed', 'Great news — we’re confirming your bookings now and will be in touch about payment and final details.'],
    declined: ['Thanks for letting us know', 'We’ve closed this quote. If you’d like to change anything, reply and we’ll put together a new one.'],
    cancelled: ['Your trip request was cancelled', 'This trip request has been cancelled. If that’s unexpected, just reply to this email.'],
  }[status];
  if (!copy) return;
  await safe(
    () =>
      sendMail({
        to: r.contact.email,
        user: r.user,
        event: `trip_${status}`,
        subject: `${copy[0]} (${r.reference})`,
        html: wrap(copy[0], `<p>Hi ${escapeHtml(r.contact.name)},</p><p>${copy[1]}</p><p><strong>Reference:</strong> ${r.reference}</p>`),
      }),
    status
  );
}

module.exports = { notifyTripRequested, notifyQuoteSent, notifyStatus, itineraryHtml };
