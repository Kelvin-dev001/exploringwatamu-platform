'use strict';

const User = require('../models/User');
const { verifyToken, isCurrent, bearer } = require('../services/tokens');

// Attaches req.user when a valid, current *user* token is sent; otherwise
// carries on as a guest. Never rejects — for routes that work signed in or out.
module.exports = async function optionalUser(req, res, next) {
  const token = bearer(req);
  if (!token) return next();
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next(); // invalid/expired token: treat as guest
  }
  if (decoded.admin) return next();
  try {
    const user = await User.findById(decoded.id).select('_id name email tokenVersion');
    if (user && isCurrent(decoded, user)) req.user = user;
  } catch (err) {
    return next(err);
  }
  next();
};
