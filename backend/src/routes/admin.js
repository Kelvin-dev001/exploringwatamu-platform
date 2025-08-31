const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const authAdmin = require('../middleware/authAdmin'); // Protect admin-only actions

// Admin login (no protection)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin || !(await admin.validatePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Add 'admin: true' to payload for fine-grained protection
  const token = jwt.sign({ id: admin._id, email: admin.email, admin: true }, process.env.JWT_SECRET, { expiresIn: '2d' });
  res.json({ token, admin: { _id: admin._id, email: admin.email } });
});

// Example: protect admin-only actions
router.get('/profile', authAdmin, async (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;