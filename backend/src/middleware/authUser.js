const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Only allow tokens without the 'admin' flag
    if (decoded.admin) return res.status(403).json({ error: 'Admin token not allowed for this route.' });
    req.user = await User.findById(decoded.id).select('_id name');
    if (!req.user) throw new Error();
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};