'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
    name: { type: String, trim: true, maxlength: 80 },
    lastLoginAt: { type: Date },
    createdBy: { type: String }, // email of the admin who added this teammate
    // Bumped by setPassword: ends every session signed before the change (services/tokens).
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

adminSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
  this.tokenVersion = (this.tokenVersion || 0) + 1;
};

adminSchema.methods.validatePassword = async function validatePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Admin', adminSchema);
