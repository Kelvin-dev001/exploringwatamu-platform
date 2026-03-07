const mongoose = require('mongoose');

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

module.exports = mongoose.model('GroupBooking', groupBookingSchema);