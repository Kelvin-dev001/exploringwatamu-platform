'use strict';

const { sendMail } = require('./mailer');
const { sendSms } = require('./notifications/sms');
const { wrap } = require('./notifications/emailLayout');
const { buildTripQuotePdf } = require('./documents');
const whatsapp = require('./whatsapp');
const escapeHtml = require('./escapeHtml');
const logger = require('./logger');
const config = require('../config/env');
const i18n = require('../i18n');

// All sends are best-effort: callers fire these without awaiting, and a
// failed email/SMS must never fail the request itself.
//
// The traveller's emails and texts are in the language they used on the
// website (request.locale, English when missing); the team's stay English.

const money = (n) => i18n.money(n, 'en');
const fmt = (d) => i18n.date(d, 'en');

/** A day's heading: the label the website sent (English), or "Giorno 2 · lun 11 gen" in another language. */
function dayHeading(d, i, L) {
  if (L.locale === 'en') return d.label || L.t('dayN', { n: i + 1 });
  const when = d.date ? new Date(d.date) : null;
  const base = L.t('dayN', { n: i + 1 });
  return when && !Number.isNaN(when.getTime())
    ? `${base} · ${when.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}`
    : base;
}

/** The itinerary as email HTML, in a language (English for the team). */
function itineraryHtml(r, locale = 'en') {
  const L = i18n.forLocale(locale);
  const days = (r.days || [])
    .map((d, i) => {
      const items = d.items.length ? d.items.map((it) => `<li>${escapeHtml(L.item(it.title))}</li>`).join('') : `<li style="color:#888">${escapeHtml(L.t('freeDay'))}</li>`;
      return `<p style="margin:12px 0 4px;font-weight:bold">${escapeHtml(dayHeading(d, i, L))}</p><ul style="margin:0;padding-left:18px">${items}</ul>`;
    })
    .join('');
  const ideas = (r.ideas || []).length
    ? `<p style="margin:12px 0 4px;font-weight:bold">${escapeHtml(L.t('ideas'))}</p><ul style="margin:0;padding-left:18px">${r.ideas
        .map((it) => `<li>${escapeHtml(L.item(it.title))}</li>`)
        .join('')}</ul>`
    : '';
  return days + ideas;
}

/** "2 adults, 1 child · Sun Jan 10 2027 – Tue Jan 12 2027", in a language. */
function whoAndWhen(r, locale = 'en') {
  const L = i18n.forLocale(locale);
  const who =
    L.locale === 'en'
      ? `${r.adults} adult${r.adults === 1 ? '' : 's'}${r.children ? `, ${r.children} child${r.children === 1 ? '' : 'ren'}` : ''}`
      : [L.t('adults', { count: r.adults }), r.children ? L.t('children', { count: r.children }) : null].filter(Boolean).join(', ');
  const when = r.arrival ? `${L.date(r.arrival)} – ${L.date(r.departure)}` : L.t('daysFlexible', { count: (r.days || []).length });
  return `${who} · ${when}`;
}

async function safe(fn, label) {
  try {
    await fn();
  } catch (err) {
    logger.error('trip request notification failed', { step: label, ...logger.errorFields(err) });
  }
}

async function notifyTripRequested(r) {
  const L = i18n.forLocale(r.locale);
  const name = escapeHtml(r.contact.name);
  await safe(
    () =>
      sendMail({
        to: r.contact.email,
        user: r.user,
        event: 'trip_requested',
        subject: L.t('ackSubject', { reference: r.reference }),
        html: wrap(
          L.t('ackTitle'),
          `<p>${L.t('hi', { name })}</p>
          <p>${escapeHtml(L.t('ackBody'))}</p>
          <p><strong>${L.t('reference')}</strong> ${r.reference}<br/><strong>${L.t('ackTrip')}</strong> ${escapeHtml(whoAndWhen(r, L.locale))}</p>
          ${itineraryHtml(r, L.locale)}
          ${r.notes ? `<p><strong>${L.t('ackNotes')}</strong> ${escapeHtml(r.notes)}</p>` : ''}
          ${whatsapp.emailBlock({ lead: L.t('ackWhatsApp'), text: whatsapp.text.tripRequest(r.reference, L.locale), locale: L.locale })}`,
          L.locale
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
            ${r.locale && r.locale !== 'en' ? `<li>Language: ${r.locale === 'it' ? 'Italian — their emails and quote PDF are in Italian' : escapeHtml(r.locale)}</li>` : ''}
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
          message: L.t('ackSms', { name: r.contact.name, reference: r.reference, brand: config.brand.name }),
        }),
      'sms'
    );
  }
}

// The team's message usually opens with its own "Hi Ada," (the admin form
// pre-fills one): then the email doesn't add a second greeting.
const opensWithGreeting = (message) => /^\s*(hi|hello|hey|dear|jambo|habari|ciao|salve|gentile|buongiorno|buonasera)\b/i.test(message || '');

async function notifyQuoteSent(r) {
  const L = i18n.forLocale(r.locale);
  const q = r.quote;
  let attachments;
  await safe(async () => {
    const pdf = await buildTripQuotePdf(r);
    attachments = [{ filename: `quote-${r.reference}.pdf`, content: pdf }];
  }, 'pdf');

  // Line labels and the message are the team's own words, sent as written.
  const lines = q.lines.map((l) => `<tr><td style="padding:4px 0">${escapeHtml(l.label)}</td><td style="padding:4px 0;text-align:right">${L.money(l.amount)}</td></tr>`).join('');
  await safe(
    () =>
      sendMail({
        to: r.contact.email,
        user: r.user,
        event: 'trip_quote_sent',
        subject: L.t('quoteSubject', { reference: r.reference }),
        html: wrap(
          L.t('quoteTitle'),
          `${opensWithGreeting(q.message) ? '' : `<p>${L.t('hi', { name: escapeHtml(r.contact.name) })}</p>`}
          ${q.message ?`<p>${escapeHtml(q.message).replace(/\n/g, '<br/>')}</p>` : `<p>${escapeHtml(L.t('quoteDefault'))}</p>`}
          <table style="width:100%;border-collapse:collapse;margin:12px 0">${lines}
            <tr><td style="padding:8px 0;border-top:1px solid #eee;font-weight:bold">${L.t('quoteTotal')}</td><td style="padding:8px 0;border-top:1px solid #eee;text-align:right;font-weight:bold">${L.money(q.total)}</td></tr>
          </table>
          ${q.validUntil ? `<p>${L.t('quoteValid', { date: L.date(q.validUntil) })}</p>` : ''}
          <p>${escapeHtml(L.t('quoteGoAhead'))}</p>
          <p><strong>${L.t('reference')}</strong> ${r.reference}</p>
          ${whatsapp.emailBlock({ lead: L.t('quoteWhatsApp'), text: whatsapp.text.tripQuote(r.reference, L.locale), locale: L.locale })}`,
          L.locale
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
          message: L.t('quoteSms', { reference: r.reference, total: L.money(q.total), brand: config.brand.name }),
        }),
      'quote-sms'
    );
  }
}

const STATUS_COPY = {
  accepted: ['acceptedTitle', 'acceptedBody'],
  declined: ['declinedTitle', 'declinedBody'],
  cancelled: ['cancelledTitle', 'cancelledBody'],
};

async function notifyStatus(r, status) {
  const keys = STATUS_COPY[status];
  if (!keys) return;
  const L = i18n.forLocale(r.locale);
  const [title, body] = keys.map((k) => L.t(k));
  await safe(
    () =>
      sendMail({
        to: r.contact.email,
        user: r.user,
        event: `trip_${status}`,
        subject: L.t('statusSubject', { title, reference: r.reference }),
        html: wrap(title, `<p>${L.t('hi', { name: escapeHtml(r.contact.name) })}</p><p>${escapeHtml(body)}</p><p><strong>${L.t('reference')}</strong> ${r.reference}</p>`, L.locale),
      }),
    status
  );
}

module.exports = { notifyTripRequested, notifyQuoteSent, notifyStatus, itineraryHtml, whoAndWhen };
