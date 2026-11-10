'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    passwordHash: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },

    // Travel profile data (vibe selection)
    travelPersonalities: [{ type: String }], // e.g., ['Party Starter', 'Music Lover']
    travelGroup: { type: String }, // e.g., 'Solo But Social'
    selectedAvatar: { type: String }, // e.g., 'avatar_1.png'

    // Safari Points for referrals
    safariPoints: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true }, // slug-based like 'sarah-smith'

    // Password reset (hashed token + expiry)
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },

    // Bumped by setPassword: ends every session signed before the change (services/tokens).
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Generate referral code from name (slug format)
userSchema.pre('save', function generateReferralCode(next) {
  if (!this.referralCode && this.name) {
    this.referralCode =
      this.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Math.random().toString(36).substring(7);
  }
  next();
});

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
  this.tokenVersion = (this.tokenVersion || 0) + 1;
};

userSchema.methods.validatePassword = async function validatePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
