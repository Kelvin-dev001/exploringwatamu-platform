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

const nodeEnv = process.env.NODE_ENV || 'development';

const jwtSecret = readEnv('JWT_SECRET', { required: true, min: 16 });
if (jwtSecret === 'your_jwt_secret') {
  throw new Error('[config] JWT_SECRET is set to an insecure default value. Set a strong, unique secret.');
}

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
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Where admin booking notifications are sent.
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '',

  // Outbound email (SMTP). If host/user are unset, the mailer uses a safe
  // dev transport that serializes messages instead of sending them.
  mail: {
    from: process.env.MAIL_FROM || 'ExploringWatamu <no-reply@exploringwatamu.com>',
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },

  brand: {
    name: 'ExploringWatamu',
    supportEmail: process.env.SUPPORT_EMAIL || 'hello@exploringwatamu.com',
  },

  // SMS via Africa's Talking. A no-op (logged) when username/apiKey are unset.
  sms: {
    env: process.env.AT_ENV || 'production', // 'sandbox' | 'production'
    username: process.env.AT_USERNAME || '',
    apiKey: process.env.AT_API_KEY || '',
    senderId: process.env.AT_SENDER_ID || '',
  },

  // Password-reset token lifetime, in minutes.
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES) || 60,
};

module.exports = config;
