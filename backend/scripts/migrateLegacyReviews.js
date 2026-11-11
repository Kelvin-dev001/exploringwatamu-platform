'use strict';

/*
 * Copies the old stay-only reviews into the new Review model. See docs/REVIEWS.md.
 *
 *   npm run reviews:migrate -- --dry-run                    report only (any database)
 *   npm run reviews:migrate -- --confirm-db=<database name> copy
 *
 * Safe on production: it only ever adds copies (never changes or deletes the
 * old reviews), skips anything already copied, and refuses to write unless
 * --confirm-db names the database it is connected to.
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { argValue } = require('./seedDemo');

function refusal({ dryRun, confirmDb, dbName }) {
  if (dryRun) return null;
  if (!confirmDb) return `Connected to database "${dbName}". Run with --dry-run to see what would be copied, or --confirm-db=${dbName} to copy.`;
  if (confirmDb !== dbName) return `--confirm-db="${confirmDb}" does not match the database this connects to ("${dbName}"). Nothing was written.`;
  return null;
}

async function main(argv = process.argv.slice(2), log = console.log) {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (see backend/.env.example).');
  await mongoose.connect(uri);
  try {
    const dbName = mongoose.connection.name;
    const dryRun = argValue(argv, '--dry-run') !== undefined;
    const stop = refusal({ dryRun, confirmDb: argValue(argv, '--confirm-db'), dbName });
    if (stop) throw new Error(stop);

    const { migrateLegacyReviews } = require('../src/services/legacyReviewMigration');
    const r = await migrateLegacyReviews({ dryRun, log: (line) => log(`  ${line}`) });
    log(`${dryRun ? '[dry run] ' : ''}"${dbName}": ${r.imported} legacy review(s) ${dryRun ? 'would be ' : ''}copied (${r.stays} stay(s)); ${r.alreadyImported} already copied; ${r.invalid.length} not copyable.`);
    for (const bad of r.invalid) log(`  not copyable: ${bad.source} ${bad.id} — ${bad.reason}`);
    return r;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Review migration stopped: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, refusal };
