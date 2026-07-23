'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Verifies an admin JWT. Requires the `admin` claim.
module.exports = function authAdmin(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded.admin) return res.status(403).json({ error: 'Admin access required' });
    req.admin = { id: decoded.id, email: decoded.email, role: decoded.role || 'admin' };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
