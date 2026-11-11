'use strict';

const mongoose = require('mongoose');

// An audit log of every notification the platform sends (email or SMS).
// Useful for support, debugging deliverability, and future retries.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    event: { type: String }, // e.g. 'booking_requested', 'booking_confirmed', 'password_reset'
    to: { type: String, required: true },
    subject: { type: String },
    status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' },
    error: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// The admin's delivery log (newest first) and the dashboard's recent failures.
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
