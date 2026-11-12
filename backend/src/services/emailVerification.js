'use strict';

const crypto = require('crypto');

/*
 * Confirming that a password account owns its email address (security
 * review finding S6). Until it does, the account sees only what it did while
 * signed in: guest trip requests sent with the same address stay hidden from
 * it (My trips, reviews), because anyone can type someone else's address at
 * sign-up. Google accounts count as confirmed: Google verified the address
 * (routes/userAuth.js refuses unverified Google emails).
 *
 * The link carries a random single-use token; only its SHA-256 hash is
 * stored, like password reset links.
 */

const VERIFY_TOKEN_TTL_HOURS = 72;

const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');

/** Has this account shown it owns its email address? */
const ownsEmail = (user) => Boolean(user && (user.emailVerifiedAt || user.googleId));

/** A fresh link token for the user (replacing any earlier one). Save the user afterwards. */
function issueVerificationToken(user, now = Date.now()) {
  const raw = crypto.randomBytes(32).toString('hex');
  user.verifyTokenHash = hashToken(raw);
  user.verifyTokenExpires = new Date(now + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  return raw;
}

/** Mark the address confirmed and spend the token. Save the user afterwards. */
function markVerified(user, now = new Date()) {
  user.emailVerifiedAt = user.emailVerifiedAt || now;
  user.verifyTokenHash = undefined;
  user.verifyTokenExpires = undefined;
}

module.exports = { VERIFY_TOKEN_TTL_HOURS, hashToken, ownsEmail, issueVerificationToken, markVerified };
