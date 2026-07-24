'use strict';

const Admin = require('../models/Admin');
const config = require('../config/env');

// If BOOTSTRAP_ADMIN_EMAIL/PASSWORD are set, make sure that admin exists with
// that password on startup: creates it if missing, resets the password if it
// has drifted. Does nothing when the env vars are unset. Safe on every boot.
async function ensureBootstrapAdmin() {
  const { email, password } = config.bootstrapAdmin;
  if (!email || !password) return;

  const normalized = String(email).toLowerCase().trim();
  const admin = await Admin.findOne({ email: normalized });

  if (!admin) {
    const created = new Admin({ email: normalized });
    await created.setPassword(password);
    await created.save();
    console.log(`[bootstrap] Admin created: ${normalized}`);
    return;
  }

  const matches = await admin.validatePassword(password);
  if (!matches) {
    await admin.setPassword(password);
    await admin.save();
    console.log(`[bootstrap] Admin password reset from env: ${normalized}`);
  }
}

module.exports = ensureBootstrapAdmin;
