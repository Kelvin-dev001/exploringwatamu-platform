'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

// Verifies a user JWT. Rejects admin tokens on user routes.
module.exports = async function authUser(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.admin) return res.status(403).json({ error: 'Admin token not allowed for this route' });
    req.user = await User.findById(decoded.id).select('_id name email');
    if (!req.user) return res.status(401).json({ error: 'Invalid token' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
