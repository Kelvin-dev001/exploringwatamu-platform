const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const User = require('../models/User');
const authUser = require('../middleware/authUser');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const user = new User({ name, email, phone: phone || '' });
    await user.setPassword(password);
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.', details: err.message });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
    }
    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.', details: err.message });
  }
});

// GET /api/auth/me — protected
router.get('/me', authLimiter, authUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('_id name email phone avatar');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// POST /api/auth/google — Google Sign-In
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    // Verify the Google ID token via tokeninfo endpoint
    const googleRes = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const payload = googleRes.data;

    // Validate the audience matches our client ID
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '728099992484-opn05vmlv2b4ddfenli3kcfqb1244l5v.apps.googleusercontent.com';
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Invalid Google token audience.' });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Invalid Google token payload.' });
    }

    // Check if user exists by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists by email (link Google account)
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.avatar = avatar || user.avatar;
        await user.save();
      } else {
        // Create new Google-only user
        user = new User({ name, email, googleId, avatar });
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
  } catch (err) {
    console.error('Google auth error:', err?.response?.data || err.message);
    res.status(401).json({ error: 'Google authentication failed.' });
  }
});

module.exports = router;
