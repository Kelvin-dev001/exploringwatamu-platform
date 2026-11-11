'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/*
 * Every JWT is signed and checked here.
 *
 * - One algorithm, pinned on verify, so a token can't choose how it is checked.
 * - `tv` (token version): User and Admin carry a tokenVersion that setPassword
 *   bumps, so a password change or reset ends every session signed before it
 *   (a stolen token stops working at once instead of in 7 days). Tokens from
 *   before this claim existed count as version 0, like accounts that never
 *   changed their password, so deploying it signs nobody out.
 */
const ALGORITHM = 'HS256';

function signUserToken(user) {
  return jwt.sign({ id: user._id, tv: user.tokenVersion || 0 }, config.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: config.jwtExpiresIn,
  });
}

function signAdminToken(admin) {
  return jwt.sign(
    { id: admin._id, email: admin.email, admin: true, role: admin.role || 'admin', tv: admin.tokenVersion || 0 },
    config.jwtSecret,
    { algorithm: ALGORITHM, expiresIn: config.adminJwtExpiresIn }
  );
}

/**
 * A sign-in (session) token. Throws (like jwt.verify) when the token is
 * invalid or expired — or carries an audience: only purpose tokens such as
 * review invitations have one, and they must never sign anybody in.
 */
function verifyToken(token) {
  const decoded = jwt.verify(token, config.jwtSecret, { algorithms: [ALGORITHM] });
  if (decoded.aud !== undefined) throw new jwt.JsonWebTokenError('not a session token');
  return decoded;
}

/** False once the account's password has changed since the token was signed. */
function isCurrent(decoded, account) {
  return (Number(decoded.tv) || 0) === (account.tokenVersion || 0);
}

const bearer = (req) => req.header('Authorization')?.replace('Bearer ', '');

/*
 * Review invitations. The post-trip email links to the review page with this
 * token: whoever opens it has shown they read the booking's contact inbox, so a
 * guest request (made without an account) can be reviewed from whichever
 * account they sign in with. It carries no `id`, so it can never pass as a
 * sign-in token, and a sign-in token can't pass as an invitation (audience).
 */
const INVITE_AUDIENCE = 'review-invite';
const INVITE_TTL = '120d';

function signReviewInvite({ bookingType, bookingId, email }) {
  return jwt.sign({ bt: bookingType, bid: String(bookingId), em: String(email).toLowerCase() }, config.jwtSecret, {
    algorithm: ALGORITHM,
    audience: INVITE_AUDIENCE,
    expiresIn: INVITE_TTL,
  });
}

/** { bookingType, bookingId, email } for a valid invitation, otherwise null. */
function verifyReviewInvite(token) {
  if (typeof token !== 'string' || !token) return null;
  try {
    const d = jwt.verify(token, config.jwtSecret, { algorithms: [ALGORITHM], audience: INVITE_AUDIENCE });
    return d.bt && d.bid && d.em ? { bookingType: d.bt, bookingId: d.bid, email: d.em } : null;
  } catch {
    return null;
  }
}

module.exports = { signUserToken, signAdminToken, verifyToken, isCurrent, bearer, signReviewInvite, verifyReviewInvite, ALGORITHM };
