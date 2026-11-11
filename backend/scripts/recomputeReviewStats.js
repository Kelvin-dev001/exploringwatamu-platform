'use strict';

/*
 * Recomputes every listing's rating (reviewStats) from its approved reviews.
 * Ratings are kept up to date automatically; this is a repair tool (after a
 * restore, or a manual database edit). Writes only reviewStats; idempotent.
 *
 *   npm run reviews:recompute -- --confirm-db=<database name>
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { argValue } = require('./seedDemo');

async function main(argv = process.argv.slice(2), log = console.log) {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (see backend/.env.example).');
  await mongoose.connect(uri);
  try {
    const dbName = mongoose.connection.name;
    const confirmDb = argValue(argv, '--confirm-db');
    if (confirmDb !== dbName) throw new Error(`Connected to "${dbName}". Run again with --confirm-db=${dbName} to recompute its ratings.`);
    const { recomputeAll } = require('../src/services/reviewStats');
    const { listings } = await recomputeAll();
    log(`Recomputed the rating of ${listings} listing(s) in "${dbName}".`);
    return { listings };
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Recompute stopped: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
