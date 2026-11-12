const mongoose = require('mongoose');
const { LOCALES, DEFAULT_LOCALE } = require('../constants/locales');

const groupBookingSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupTrip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  paymentType: { type: String, enum: ['deposit', 'full'], required: true },
  amountPaid: { type: Number, required: true },
  amountDue: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  // The language the traveller booked in: their emails, SMS and PDFs are in it.
  locale: { type: String, enum: LOCALES, default: DEFAULT_LOCALE },
  mpesaReceiptNumber: { type: String },
  
  // NEW: Travel vibe data (collected BEFORE payment)
  travelPersonalities: [{ type: String }], // max 3, e.g., ['Party Starter', 'Music Lover', 'Beach Bum']
  travelGroup: { type: String }, // single choice: 'Solo But Social', 'Couple Traveler', 'In a Friends Crew', 'Digital Nomad'
  selectedAvatar: { type: String }, // e.g., 'avatar_2.png'
  
  // NEW: Referral tracking
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who referred this booking
  
  // NEW: E-card sharing
  eCardUrl: { type: String }, // generated shareable link for e-card
  eCardShared: { type: Boolean, default: false },
  eCardSharedAt: { type: Date },
  
}, { timestamps: true });

// Indexes follow the real queries (docs/DATABASE.md):
groupBookingSchema.index({ user: 1, createdAt: -1 }); // a traveller's bookings
groupBookingSchema.index({ trip: 1, status: 1, createdAt: -1 }); // a trip's bookings / confirmed participants
groupBookingSchema.index({ status: 1, createdAt: 1 }); // pending bookings to approve
groupBookingSchema.index({ createdAt: -1 }); // admin list, newest first

module.exports = mongoose.model('GroupBooking', groupBookingSchema);