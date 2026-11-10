'use strict';

const Admin = require('../models/Admin');
const { verifyToken, isCurrent, bearer } = require('../services/tokens');

// The JWT alone isn't enough: removing a teammate, or changing their password,
// must end their access at once, not when their token expires.
// Returns { admin } (req.admin's shape) or { reason } when the token is no good.
async function findAdmin(decoded) {
  const admin = await Admin.findById(decoded.id).select('email role tokenVersion').lean();
  if (!admin) return { reason: 'This admin account no longer exists' };
  if (!isCurrent(decoded, admin)) return { reason: 'Your password was changed. Please sign in again.' };
  return { admin: { id: String(admin._id), email: admin.email, role: admin.role || 'admin' } };
}

// req.admin's shape, or null if the admin is gone or the token is out of date.
async function loadAdmin(decoded) {
  return (await findAdmin(decoded)).admin || null;
}

// Verifies an admin JWT. Requires the `admin` claim and a live, current Admin record.
async function authAdmin(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (!decoded.admin) return res.status(403).json({ error: 'Admin access required' });

  let found;
  try {
    found = await findAdmin(decoded);
  } catch (err) {
    return next(err);
  }
  if (!found.admin) return res.status(401).json({ error: found.reason });
  req.admin = found.admin;
  next();
}

module.exports = authAdmin;
module.exports.bearer = bearer;
module.exports.loadAdmin = loadAdmin;
