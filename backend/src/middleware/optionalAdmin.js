'use strict';

const { bearer, loadAdmin } = require('./authAdmin');
const { verifyToken } = require('../services/tokens');

// Attaches req.admin when a valid, current *admin* token is sent; otherwise
// carries on as the public. Never rejects — for public reads that admins see
// more of (e.g. hidden listings in the admin catalogue).
module.exports = async function optionalAdmin(req, res, next) {
  const token = bearer(req);
  if (!token) return next();
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next(); // invalid/expired token: treat as the public
  }
  if (!decoded.admin) return next();
  try {
    const admin = await loadAdmin(decoded);
    if (admin) req.admin = admin;
  } catch (err) {
    return next(err);
  }
  next();
};
