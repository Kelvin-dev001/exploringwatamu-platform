'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Admin = require('../models/Admin');

const bearer = (req) => req.header('Authorization')?.replace('Bearer ', '');

// The JWT alone isn't enough: removing a teammate must end their access at
// once, not when their token expires. Returns req.admin's shape, or null if
// the admin no longer exists.
async function loadAdmin(decoded) {
  const admin = await Admin.findById(decoded.id).select('email role').lean();
  if (!admin) return null;
  return { id: String(admin._id), email: admin.email, role: admin.role || 'admin' };
}

// Verifies an admin JWT. Requires the `admin` claim and a live Admin record.
async function authAdmin(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (!decoded.admin) return res.status(403).json({ error: 'Admin access required' });

  try {
    req.admin = await loadAdmin(decoded);
  } catch (err) {
    return next(err);
  }
  if (!req.admin) return res.status(401).json({ error: 'This admin account no longer exists' });
  next();
}

module.exports = authAdmin;
module.exports.bearer = bearer;
module.exports.loadAdmin = loadAdmin;
