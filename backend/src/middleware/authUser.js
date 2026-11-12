'use strict';

const User = require('../models/User');
const { verifyToken, isCurrent, bearer } = require('../services/tokens');

// Verifies a user JWT. Rejects admin tokens on user routes, and tokens signed
// before the account's last password change.
module.exports = async function authUser(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (decoded.admin) return res.status(403).json({ error: 'Admin token not allowed for this route' });

  try {
    // emailVerifiedAt/googleId: whether guest requests with this address are theirs (S6).
    const user = await User.findById(decoded.id).select('_id name email tokenVersion emailVerifiedAt googleId');
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    if (!isCurrent(decoded, user)) return res.status(401).json({ error: 'Your password was changed. Please sign in again.' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
