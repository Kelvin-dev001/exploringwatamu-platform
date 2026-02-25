const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Read from environment variables (set in Render dashboard)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@exploringwatamu.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // bcrypt hash
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD; // fallback plain text
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  let isValid = false;

  // If a bcrypt hash is set, use secure comparison
  if (ADMIN_PASSWORD_HASH) {
    isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else if (ADMIN_PASSWORD_PLAIN) {
    // Fallback to plain text comparison (not ideal but works)
    isValid = password === ADMIN_PASSWORD_PLAIN;
  } else {
    // Default fallback (change this!)
    isValid = password === "123456";
  }

  if (isValid) {
    const token = jwt.sign({ email, admin: true }, JWT_SECRET, { expiresIn: "2d" });
    return res.json({ token, admin: { email } });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

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