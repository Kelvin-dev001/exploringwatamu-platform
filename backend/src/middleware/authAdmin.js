const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Only allow tokens with the 'admin' flag
    if (!decoded.admin) return res.status(403).json({ error: 'User token not allowed for this route.' });
    req.admin = { email: decoded.email }; // Just attach email from token
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};