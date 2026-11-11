'use strict';

const mongoose = require('mongoose');

/*
 * One post-trip review invitation per booking (scripts/sendReviewInvites.js).
 * Its own collection, so the job never writes to bookings or trip requests.
 * The unique key makes a second invitation impossible, even from two job runs
 * at once: the run that inserts the record is the one that sends.
 *
 *   sending  claimed by a run, email in progress
 *   sent     delivered to the mail server (never sent again)
 *   failed   the email failed; retried by later runs up to INVITE_MAX_ATTEMPTS
 */
const reviewInviteSchema = new mongoose.Schema(
  {
    bookingType: { type: String, enum: ['tripRequest', 'groupBooking'], required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['sending', 'sent', 'failed'], default: 'sending' },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, maxlength: 500 },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

reviewInviteSchema.index({ bookingType: 1, bookingId: 1 }, { unique: true });

module.exports = mongoose.model('ReviewInvite', reviewInviteSchema);
