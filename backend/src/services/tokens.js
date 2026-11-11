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

/** Throws (like jwt.verify) when the token is invalid or expired. */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: [ALGORITHM] });
}

/** False once the account's password has changed since the token was signed. */
function isCurrent(decoded, account) {
  return (Number(decoded.tv) || 0) === (account.tokenVersion || 0);
}

const bearer = (req) => req.header('Authorization')?.replace('Bearer ', '');

module.exports = { signUserToken, signAdminToken, verifyToken, isCurrent, bearer, ALGORITHM };
