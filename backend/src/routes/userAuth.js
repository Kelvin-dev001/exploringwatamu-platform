'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/env');
const User = require('../models/User');
const authUser = require('../middleware/authUser');
const validate = require('../middleware/validate');
const crypto = require('crypto');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema } = require('../validators/authValidators');
const { authLimiter, sessionLimiter, resetRequestLimiter, resetAddressLimiter, verifyResendLimiter } = require('../middleware/rateLimiters');
const { signUserToken } = require('../services/tokens');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/notifications/authNotifications');
const { deliveryFor } = require('../services/notifications/delivery');
const { hashToken, issueVerificationToken, markVerified, ownsEmail } = require('../services/emailVerification');
const logger = require('../services/logger');
const { sitePath } = require('../i18n');

// What the website gets back about the signed-in account. emailVerified: the
// account has shown it owns its address (confirmed link, reset link or Google).
const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar, emailVerified: ownsEmail(u) });

/** Issue a confirmation link and email it (after answering; a mail failure never fails the request). */
async function sendConfirmation(user, locale, requestId) {
  const raw = issueVerificationToken(user);
  await user.save();
  const url = `${config.frontendUrl.replace(/\/$/, '')}${sitePath('/verify-email', locale)}?token=${raw}`;
  Promise.resolve()
    .then(() => sendVerificationEmail(user, url, locale))
    .catch((mailErr) => logger.error('verification email failed', { requestId, ...logger.errorFields(mailErr) }));
}

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, phone, password, locale } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const user = new User({ name, email, phone: phone || '' });
    await user.setPassword(password);
    await user.save();
    // Signed in straight away; guest requests with this address appear once the
    // emailed link is clicked (S6).
    await sendConfirmation(user, locale, req.id);
    const token = signUserToken(user);
    res.status(201).json({ token, user: publicUser(user), delivery: deliveryFor({ email: user.email }) });
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
    const token = signUserToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — protected. Runs on every page load of the website, so it
// has its own (generous) limit rather than eating into the sign-in attempts.
router.get('/me', sessionLimiter, authUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('_id name email phone avatar emailVerifiedAt googleId');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(publicUser(user));
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
      return res.status(503).json({ error: 'Google Sign-In is not configured.' });
    }

    const googleRes = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { id_token: String(credential) }, timeout: 10000 });
    const payload = googleRes.data;

    if (payload.aud !== config.googleClientId) {
      return res.status(401).json({ error: 'Invalid Google token audience.' });
    }

    const { sub: googleId, name, picture: avatar } = payload;
    const email = payload.email ? String(payload.email).toLowerCase().trim() : '';
    if (!email || !googleId) return res.status(400).json({ error: 'Invalid Google token payload.' });
    // Only trust the email for linking or creating an account when Google has
    // verified it; otherwise anyone could claim an existing account's address.
    // tokeninfo returns the flag as the string "true".
    if (String(payload.email_verified) !== 'true') {
      return res.status(401).json({ error: 'Your Google email address isn’t verified yet. Verify it with Google, or sign in with email and password.' });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      // Google verified the address (checked above), so it counts as confirmed.
      if (user) {
        user.googleId = googleId;
        user.avatar = avatar || user.avatar;
        markVerified(user);
        await user.save();
      } else {
        user = new User({ name, email, googleId, avatar, emailVerifiedAt: new Date() });
        await user.save();
      }
    }

    const token = signUserToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    logger.warn('Google sign-in failed', { requestId: req.id, googleError: err?.response?.data?.error, ...logger.errorFields(err) });
    res.status(401).json({ error: 'Google authentication failed.' });
  }
});

// POST /api/auth/forgot-password — always responds 200 (never reveals whether
// the email exists). The email is sent after answering, so the response time
// does not give it away either. Limited per IP and per address.
router.post('/forgot-password', resetRequestLimiter, resetAddressLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email, locale } = req.body;
    const user = await User.findOne({ email });
    if (user && user.passwordHash) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.resetTokenExpires = new Date(Date.now() + config.resetTokenTtlMinutes * 60 * 1000);
      await user.save();
      // The link opens the reset page in the language the request came from.
      const resetUrl = `${config.frontendUrl.replace(/\/$/, '')}${sitePath('/reset-password', locale)}?token=${rawToken}`;
      Promise.resolve()
        .then(() => sendPasswordResetEmail(user, resetUrl, locale))
        .catch((mailErr) => logger.error('password reset email failed', { requestId: req.id, ...logger.errorFields(mailErr) }));
    }
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });

    // Also signs out every existing session (tokenVersion).
    await user.setPassword(password);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    // The link was emailed to this address: that proves it is theirs.
    markVerified(user);
    await user.save();
    res.json({ message: 'Password has been reset. You can now sign in.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email — the link in the confirmation email. Works
// without being signed in (the token is the proof), once, until it expires.
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ verifyTokenHash: hashToken(req.body.token), verifyTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired confirmation link.', code: 'VERIFY_LINK_INVALID' });
    markVerified(user);
    await user.save();
    res.json({ message: 'Email address confirmed.', email: user.email });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-verification — "send me a new link" (signed in).
// A few an hour per account; nothing to do for an address already confirmed.
router.post('/resend-verification', authUser, verifyResendLimiter, validate(resendVerificationSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (ownsEmail(user)) return res.json({ alreadyVerified: true });
    await sendConfirmation(user, req.body.locale, req.id);
    res.json({ alreadyVerified: false, delivery: deliveryFor({ email: user.email }) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
