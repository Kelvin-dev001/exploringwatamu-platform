'use strict';

// Centralized environment configuration with fail-fast validation.
// Requiring this module asserts that critical secrets are present and safe,
// so the app refuses to boot in an insecure/misconfigured state.

const dotenv = require('dotenv');
dotenv.config();

function readEnv(name, { aliases = [], required = false, min = 0 } = {}) {
  let value = process.env[name];
  for (const alias of aliases) {
    if (value === undefined || value === '') value = process.env[alias];
  }
  if (required && (value === undefined || String(value).trim() === '')) {
    throw new Error(`[config] Missing required environment variable: ${name}`);
  }
  if (min && value && String(value).length < min) {
    throw new Error(`[config] Environment variable ${name} must be at least ${min} characters long`);
  }
  return value;
}

// Reads an all-or-nothing group of variables. A partially set group is a
// misconfiguration (e.g. one secret missed on the host), so refuse to boot;
// a fully unset group just leaves that integration disabled.
function readEnvGroup(label, names) {
  const values = {};
  for (const name of names) values[name] = String(process.env[name] || '').trim();
  const missing = names.filter((name) => !values[name]);
  if (missing.length > 0 && missing.length < names.length) {
    throw new Error(`[config] ${label} is partially configured. Missing: ${missing.join(', ')}`);
  }
  return { enabled: missing.length === 0, values };
}

const nodeEnv = process.env.NODE_ENV || 'development';

const smtpHost = process.env.SMTP_HOST || '';
const smtpUser = process.env.SMTP_USER || '';
const atUsername = process.env.AT_USERNAME || '';
const atApiKey = process.env.AT_API_KEY || '';

const jwtSecret = readEnv('JWT_SECRET', { required: true, min: 16 });
if (jwtSecret === 'your_jwt_secret') {
  throw new Error('[config] JWT_SECRET is set to an insecure default value. Set a strong, unique secret.');
}

// Image hosting is optional but all-or-nothing. While unset, upload routes
// answer 503 "Image hosting is not configured" (see middleware/upload.js).
const cloudinaryEnv = readEnvGroup('Cloudinary', [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]);

const config = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: readEnv('MONGODB_URI', { aliases: ['MONGO_URI'], required: true }),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '2d',
  // Payments (M-Pesa) stay OFF until this is explicitly enabled.
  paymentsEnabled: String(process.env.PAYMENTS_ENABLED).toLowerCase() === 'true',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendUrls: (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  cloudinary: {
    enabled: cloudinaryEnv.enabled,
    cloudName: cloudinaryEnv.values.CLOUDINARY_CLOUD_NAME,
    apiKey: cloudinaryEnv.values.CLOUDINARY_API_KEY,
    apiSecret: cloudinaryEnv.values.CLOUDINARY_API_SECRET,
  },

  // Where admin booking notifications are sent.
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '',

  // Outbound email (SMTP). If host/user are unset, the mailer uses a safe
  // dev transport that serializes messages instead of sending them.
  mail: {
    enabled: Boolean(smtpHost && smtpUser),
    from: process.env.MAIL_FROM || 'ExploringWatamu <no-reply@exploringwatamu.com>',
    host: smtpHost,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    user: smtpUser,
    pass: process.env.SMTP_PASS || '',
  },

  brand: {
    name: 'ExploringWatamu',
    supportEmail: process.env.SUPPORT_EMAIL || 'hello@exploringwatamu.com',
  },

  // SMS via Africa's Talking. A no-op (logged) when username/apiKey are unset.
  sms: {
    enabled: Boolean(atUsername && atApiKey),
    env: process.env.AT_ENV || 'production', // 'sandbox' | 'production'
    username: atUsername,
    apiKey: atApiKey,
    senderId: process.env.AT_SENDER_ID || '',
  },

  // Password-reset token lifetime, in minutes.
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES) || 60,

  // Optional bootstrap admin: if both are set, an admin account is auto-created
  // (and its password kept in sync) on server startup — set the first admin's
  // credentials via environment instead of running the seed script.
  bootstrapAdmin: {
    email: process.env.BOOTSTRAP_ADMIN_EMAIL || '',
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD || '',
  },
};

module.exports = config;
