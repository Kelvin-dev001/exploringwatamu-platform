'use strict';

/*
 * Post-trip review invitations. Meant for a Render Cron Job (daily); see
 * docs/REVIEWS.md for the setup.
 *
 *   npm run reviews:invite                      dry run: who would be invited (any database)
 *   npm run reviews:invite -- --send            send (only with NODE_ENV=production)
 *   npm run reviews:invite -- --now=2027-01-20  dry run as if it were that day (testing)
 *
 * Idempotent and safe to repeat: one invitation per booking, ever; bookings are
 * never written; with SMTP unset it sends and records nothing.
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { argValue } = require('./seedDemo');

function refusal({ send, nodeEnv, now }) {
  if (send && nodeEnv !== 'production') {
    return 'Refusing to --send outside production (NODE_ENV is not "production"): invitations go to real travellers. Run without --send for a dry run.';
  }
  if (send && now) return '--now is for dry runs only.';
  return null;
}

async function main(argv = process.argv.slice(2), log = console.log) {
  const send = argValue(argv, '--send') !== undefined;
  const nowArg = argValue(argv, '--now');
  const stop = refusal({ send, nodeEnv: process.env.NODE_ENV, now: nowArg });
  if (stop) throw new Error(stop);
  const now = nowArg ? new Date(nowArg) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`--now="${nowArg}" is not a date (use YYYY-MM-DD).`);

  const config = require('../src/config/env'); // fails fast on missing secrets
  await mongoose.connect(config.mongoUri);
  try {
    const { runReviewInvites } = require('../src/services/reviewInvites');
    const s = await runReviewInvites({ send, now, log: (line) => log(`  ${line}`) });
    if (send && !s.mailEnabled) {
      log('Email is not configured: no invitations were sent (they will go out once SMTP is set).');
    } else {
      log(`${s.dryRun ? '[dry run] ' : ''}${s.dryRun ? `${s.due} invitation(s) would be sent` : `${s.sent} sent, ${s.failed} failed`}; ${s.skipped.length} skipped.${s.dryRun && !s.mailEnabled ? ' (Email is off: --send would send nothing.)' : ''}`);
    }
    for (const k of s.skipped) log(`  skipped ${k.label}: ${k.reason}`);
    return s;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main()
    .then((s) => process.exit(s && s.failed ? 1 : 0))
    .catch((err) => {
      console.error(`Review invitations stopped: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { main, refusal };
