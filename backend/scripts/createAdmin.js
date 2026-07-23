'use strict';

// Seeds an admin account into the database (hashed password).
// Usage: npm run seed:admin -- <email> <password>
// Reads MONGODB_URI from your .env — no credentials are hardcoded here.

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');

async function createAdmin(email, password) {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await Admin.findOne({ email: normalizedEmail });
  if (existing) {
    console.error(`An admin with email "${normalizedEmail}" already exists.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const admin = new Admin({ email: normalizedEmail });
  await admin.setPassword(password);
  await admin.save();
  console.log('Admin created:', normalizedEmail);
  await mongoose.disconnect();
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.log('Usage: npm run seed:admin -- <email> <password>');
  process.exit(1);
}

createAdmin(email, password).catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
