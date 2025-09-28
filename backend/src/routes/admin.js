const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Default admin credentials
const ADMIN_EMAIL = "admin@exploringwatamu.com";
const ADMIN_PASSWORD = "123456";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // Set in .env for production

// Admin login (no database, just default credentials)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Issue JWT token
    const token = jwt.sign({ email, admin: true }, JWT_SECRET, { expiresIn: "2d" });
    return res.json({ token, admin: { email } });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

// Example: protect admin-only actions
const authAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.admin) throw new Error("Not admin");
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

router.get('/profile', authAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;