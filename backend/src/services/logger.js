'use strict';

/*
 * Structured logs. One JSON object per line in production (searchable in
 * Render's log viewer, easy to ship elsewhere later), readable lines in
 * development, errors only under tests. LOG_LEVEL (debug|info|warn|error|
 * silent) and LOG_FORMAT (json|text) override the defaults.
 *
 * Fields are scrubbed: anything that looks like a secret is replaced, long
 * strings are cut. Don't log request bodies; mask emails and phone numbers
 * with maskEmail / maskPhone.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };
const nodeEnv = process.env.NODE_ENV || 'development';
const defaultLevel = nodeEnv === 'test' ? 'error' : nodeEnv === 'production' ? 'info' : 'debug';
const threshold = LEVELS[process.env.LOG_LEVEL] ?? LEVELS[defaultLevel];
const asJson = process.env.LOG_FORMAT ? process.env.LOG_FORMAT === 'json' : nodeEnv === 'production';

// Keys whose values are never logged (passengers, passport etc. are fine).
const SECRET_KEY = /password|passwd|passkey|^pass$|^pwd$|token|secret|authorization|cookie|api[-_]?key|credential|signature|^jwt$/i;
const MAX_STRING = 2000;

function scrub(value, depth = 0) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (depth > 4) return '[…]';
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = SECRET_KEY.test(k) ? '[redacted]' : scrub(v, depth + 1);
    return out;
  }
  return String(value);
}

function write(level, msg, fields) {
  if (LEVELS[level] < threshold) return;
  const entry = { time: new Date().toISOString(), level, msg, ...(fields ? scrub(fields) : {}) };
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  if (asJson) out(JSON.stringify(entry));
  else out(`[${level}] ${msg}${fields ? ` ${JSON.stringify(scrub(fields))}` : ''}`);
}

/** Safe fields for an error: its kind and message always, the stack only when asked. */
function errorFields(err, { stack = false } = {}) {
  if (err == null) return {};
  if (typeof err !== 'object') return { errMessage: String(err) };
  return {
    errName: err.name,
    errMessage: err.message,
    ...(err.code !== undefined ? { errCode: err.code } : {}),
    ...(stack && err.stack ? { stack: err.stack } : {}),
  };
}

/** "amina@example.com" -> "a***@example.com" */
function maskEmail(email) {
  const [user, domain] = String(email || '').split('@');
  return domain ? `${user.slice(0, 1)}***@${domain}` : '***';
}

/** "+254712345678" -> "+2547******78" */
function maskPhone(phone) {
  const digits = String(phone || '');
  return digits.length > 6 ? `${digits.slice(0, 5)}${'*'.repeat(Math.max(0, digits.length - 7))}${digits.slice(-2)}` : '***';
}

module.exports = {
  debug: (msg, fields) => write('debug', msg, fields),
  info: (msg, fields) => write('info', msg, fields),
  warn: (msg, fields) => write('warn', msg, fields),
  error: (msg, fields) => write('error', msg, fields),
  errorFields,
  maskEmail,
  maskPhone,
  scrub,
};
