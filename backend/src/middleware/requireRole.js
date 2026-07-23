'use strict';

// Restricts an admin route to specific roles. Use after authAdmin.
// Example: router.post('/x', authAdmin, requireRole('admin'), handler)
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.admin && req.admin.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient role for this action' });
    }
    next();
  };
};
