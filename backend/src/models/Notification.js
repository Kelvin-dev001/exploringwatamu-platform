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

module.exports = mongoose.model('Notification', notificationSchema);
