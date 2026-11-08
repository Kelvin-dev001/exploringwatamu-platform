'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

// Attaches req.user when a valid *user* token is sent; otherwise carries on as
// a guest. Never rejects — for routes that work signed in or out.
module.exports = async function optionalUser(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded.admin) req.user = await User.findById(decoded.id).select('_id name email');
  } catch {
    /* invalid/expired token: treat as guest */
  }
  next();
};
