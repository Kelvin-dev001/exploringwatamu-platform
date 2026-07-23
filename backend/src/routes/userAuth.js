'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config/env');
const User = require('../models/User');
const authUser = require('../middleware/authUser');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimiters');

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const user = new User({ name, email, phone: phone || '' });
    await user.setPassword(password);
    await user.save();
    const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
    }
    const valid = await user.validatePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — protected
router.get('/me', authLimiter, authUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('_id name email phone avatar');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/google — Google Sign-In
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ error: 'Google credential is required.' });
    if (!config.googleClientId) {
      return res.status(500).json({ error: 'Google Sign-In is not configured.' });
    }

    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = googleRes.data;

    if (payload.aud !== config.googleClientId) {
      return res.status(401).json({ error: 'Invalid Google token audience.' });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;
    if (!email || !googleId) return res.status(400).json({ error: 'Invalid Google token payload.' });

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.avatar = avatar || user.avatar;
        await user.save();
      } else {
        user = new User({ name, email, googleId, avatar });
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Google auth error:', err?.response?.data || err.message);
    res.status(401).json({ error: 'Google authentication failed.' });
  }
});

module.exports = router;
