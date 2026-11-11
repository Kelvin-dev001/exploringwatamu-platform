'use strict';

/*
 * Adds demo listings (clearly labelled "Demo · ...") to a STAGING or LOCAL
 * database so the traveller journey can be tested. See docs/OPERATIONS.md.
 *
 *   npm run seed:demo -- --confirm-db=<database name> [--dry-run]
 *
 * Safeguards:
 *   - refuses to run at all when NODE_ENV=production;
 *   - connects, then refuses to write unless --confirm-db names the database
 *     it is connected to (so a production MONGODB_URI left in .env can't be
 *     seeded by accident);
 *   - only ever creates missing demo records: never updates or deletes
 *     anything, and running it again adds nothing.
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

function argValue(argv, name) {
  const hit = argv.find((a) => a === name || a.startsWith(`${name}=`));
  if (!hit) return undefined;
  return hit.includes('=') ? hit.slice(name.length + 1) : '';
}

/** Why the seed must not run, or null. */
function refusal({ nodeEnv, confirmDb, dbName }) {
  if (nodeEnv === 'production') return 'NODE_ENV is "production": demo content is for staging and local databases only.';
  if (!confirmDb) return `Connected to database "${dbName}". To add demo listings to it, run again with --confirm-db=${dbName}`;
  if (confirmDb !== dbName) return `--confirm-db="${confirmDb}" does not match the database this connects to ("${dbName}"). Nothing was written.`;
  return null;
}

async function main(argv = process.argv.slice(2)) {
  const early = refusal({ nodeEnv: process.env.NODE_ENV, confirmDb: 'x', dbName: 'x' });
  if (early) throw new Error(early);
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (see backend/.env.example).');

  await mongoose.connect(uri);
  try {
    const dbName = mongoose.connection.name;
    const stop = refusal({ nodeEnv: process.env.NODE_ENV, confirmDb: argValue(argv, '--confirm-db'), dbName });
    if (stop) throw new Error(stop);

    const { seedDemo } = require('../src/services/demoContent');
    const dryRun = argValue(argv, '--dry-run') !== undefined;
    const { created, existing } = await seedDemo({ dryRun, log: (line) => console.log(`  ${line}`) });
    console.log(`${dryRun ? '[dry run] ' : ''}${created.length} demo record(s) ${dryRun ? 'would be ' : ''}created in "${dbName}"; ${existing} already there.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Demo seed stopped: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main, refusal, argValue };
