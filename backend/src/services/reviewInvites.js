'use strict';

const TripRequest = require('../models/TripRequest');
const GroupBooking = require('../models/GroupBooking');
const GroupTrip = require('../models/GroupTrip');
const Review = require('../models/Review');
const ReviewInvite = require('../models/ReviewInvite');
const config = require('../config/env');
const { sendMail } = require('./mailer');
const logger = require('./logger');
const { signReviewInvite } = require('./tokens');
const { inviteEmail } = require('./reviewNotifications');
const { tripRequestItems, groupBookingItems } = require('./reviewEligibility');
const { INVITE_DELAY_DAYS, INVITE_WINDOW_DAYS, INVITE_MAX_ATTEMPTS } = require('../constants/reviews');

/*
 * Post-trip review invitations, run by scripts/sendReviewInvites.js (a Render
 * Cron Job — see docs/REVIEWS.md), never by a timer in the web server.
 *
 * Due: an accepted trip request whose trip ended (departure, or arrival if
 * that's all it has) or a confirmed group booking whose group trip ended,
 * between INVITE_DELAY_DAYS and INVITE_WINDOW_DAYS ago, with at least one
 * listing that has taken place and isn't reviewed yet.
 *
 * Safe to run as often as you like:
 *   - one ReviewInvite per booking (unique key) — never two invitations;
 *   - bookings and trip requests are only read, never written;
 *   - a failed email is recorded on the invitation and retried next run (up
 *     to INVITE_MAX_ATTEMPTS), and logged in Notification by the mailer;
 *   - with email off (no SMTP) it sends nothing and records nothing, so the
 *     invitations go out once email is configured;
 *   - dry run (the default) only reports.
 */

const DAY = 86400000;
const STALE_CLAIM_MS = 60 * 60 * 1000; // a "sending" left by a crashed run is retried after an hour

async function dueBookings(now) {
  const latest = new Date(now.getTime() - INVITE_DELAY_DAYS * DAY);
  const earliest = new Date(now.getTime() - INVITE_WINDOW_DAYS * DAY);
  const inWindow = { $gte: earliest, $lt: latest };

  const [requests, trips] = await Promise.all([
    TripRequest.find({ status: 'accepted', $or: [{ departure: inWindow }, { departure: null, arrival: inWindow }] }).lean(),
    GroupTrip.find({ endDate: inWindow }).select('_id').lean(),
  ]);
  const groupBookings = trips.length ? await GroupBooking.find({ status: 'confirmed', trip: { $in: trips.map((t) => t._id) } }).lean() : [];

  return [
    ...requests.map((r) => ({ bookingType: 'tripRequest', booking: r, bookingId: r._id, email: r.contact?.email, name: r.contact?.name, user: r.user, label: r.reference })),
    ...groupBookings.map((b) => ({ bookingType: 'groupBooking', booking: b, bookingId: b._id, email: b.email, name: b.fullName, user: b.user, label: `group booking ${b._id}` })),
  ];
}

/** What a run would do, booking by booking: { ...candidate, items, action: 'send' | 'skip', reason }. */
async function planInvites(now = new Date()) {
  const plan = [];
  for (const c of await dueBookings(now)) {
    const all = c.bookingType === 'tripRequest' ? await tripRequestItems(c.booking) : await groupBookingItems(c.booking);
    const reviewed = new Set(
      (await Review.find({ 'booking.type': c.bookingType, 'booking.id': c.bookingId }).select('listingType listingId').lean()).map((r) => `${r.listingType}:${r.listingId}`)
    );
    const items = all.filter((i) => i.endsAt && i.endsAt <= now && !reviewed.has(`${i.listingType}:${i.listingId}`));
    const invite = await ReviewInvite.findOne({ bookingType: c.bookingType, bookingId: c.bookingId }).lean();

    let reason = null;
    if (!c.email) reason = 'no email';
    else if (!items.length) reason = all.length ? 'nothing left to review' : 'no reviewable listings';
    else if (invite?.status === 'sent') reason = 'already invited';
    else if (invite?.status === 'failed' && invite.attempts >= INVITE_MAX_ATTEMPTS) reason = `gave up after ${invite.attempts} failed attempts`;
    else if (invite?.status === 'sending' && now - new Date(invite.updatedAt) < STALE_CLAIM_MS) reason = 'being sent by another run';
    plan.push({ ...c, items, action: reason ? 'skip' : 'send', reason });
  }
  return plan;
}

/** Claim the booking's invitation for this run, or null if another run owns it. */
async function claim(c, now) {
  const reclaimable = {
    bookingType: c.bookingType,
    bookingId: c.bookingId,
    $or: [
      { status: 'failed', attempts: { $lt: INVITE_MAX_ATTEMPTS } },
      { status: 'sending', updatedAt: { $lt: new Date(now.getTime() - STALE_CLAIM_MS) } },
    ],
  };
  const reclaimed = await ReviewInvite.findOneAndUpdate(reclaimable, { $set: { status: 'sending', email: c.email }, $inc: { attempts: 1 } }, { new: true });
  if (reclaimed) return reclaimed;
  try {
    return await ReviewInvite.create({ bookingType: c.bookingType, bookingId: c.bookingId, email: c.email, status: 'sending', attempts: 1 });
  } catch (err) {
    if (err && err.code === 11000) return null; // sent, given up on, or claimed by a concurrent run
    throw err;
  }
}

function linkFor(c) {
  const token = signReviewInvite({ bookingType: c.bookingType, bookingId: c.bookingId, email: c.email });
  return `${config.frontendUrl.replace(/\/$/, '')}/review/${c.bookingType}/${c.bookingId}?t=${encodeURIComponent(token)}`;
}

/**
 * Run the job. send=false (default) is a dry run. Returns a summary:
 * { mailEnabled, dryRun, due, sent, failed, skipped: [{ label, reason }] }.
 */
async function runReviewInvites({ send = false, now = new Date(), log = () => {} } = {}) {
  const summary = { mailEnabled: config.mail.enabled, dryRun: !send, due: 0, sent: 0, failed: 0, skipped: [] };
  if (send && !config.mail.enabled) {
    log('email is off (SMTP_HOST / SMTP_USER not set): nothing sent, nothing recorded');
    return summary;
  }

  const plan = await planInvites(now);
  for (const c of plan) {
    if (c.action === 'skip') {
      summary.skipped.push({ label: c.label, reason: c.reason });
      continue;
    }
    summary.due += 1;
    const to = logger.maskEmail(c.email);
    if (!send) {
      log(`would invite ${to} (${c.label}): ${c.items.map((i) => i.listingTitle).join(', ')}`);
      continue;
    }
    const claimed = await claim(c, now);
    if (!claimed) {
      summary.skipped.push({ label: c.label, reason: 'claimed by another run' });
      continue;
    }
    try {
      const { subject, html } = inviteEmail({ name: c.name, items: c.items, link: linkFor(c) });
      await sendMail({ to: c.email, user: c.user || null, event: 'review_invite', subject, html });
      await ReviewInvite.updateOne({ _id: claimed._id }, { $set: { status: 'sent', sentAt: new Date() }, $unset: { lastError: 1 } });
      summary.sent += 1;
      log(`invited ${to} (${c.label})`);
    } catch (err) {
      await ReviewInvite.updateOne({ _id: claimed._id }, { $set: { status: 'failed', lastError: String(err?.message || err).slice(0, 500) } });
      summary.failed += 1;
      logger.error('review invitation failed', { bookingType: c.bookingType, to, ...logger.errorFields(err) });
      log(`FAILED ${to} (${c.label}): ${err?.message || err}`);
    }
  }
  return summary;
}

module.exports = { runReviewInvites, planInvites, linkFor };
