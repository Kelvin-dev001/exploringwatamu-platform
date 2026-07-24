'use strict';

// Seeds N test users for load testing. Uses MONGODB_URI from your .env.
// Usage: node scripts/seed.js <count>   (default 200)
// WARNING: run against a NON-production database.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function main() {
  const count = parseInt(process.argv[2], 10) || 200;
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to your .env.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  let created = 0;
  for (let i = 0; i < count; i += 1) {
    const email = `loadtest_user_${i}@example.com`;
    // eslint-disable-next-line no-await-in-loop
    if (await User.findOne({ email })) continue;
    const user = new User({ name: `Load User ${i}`, email, phone: `07${String(i).padStart(8, '0')}` });
    // eslint-disable-next-line no-await-in-loop
    await user.setPassword('password123');
    // eslint-disable-next-line no-await-in-loop
    await user.save();
    created += 1;
  }

  console.log(`Seeded ${created} new users (target ${count}). Password for all: password123`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
