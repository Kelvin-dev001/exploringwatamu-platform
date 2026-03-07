const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who shared the link
  referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who joined via the link
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupBooking', required: true },
  
  // Reward status
  pointsAwarded: { type: Number, default: 0 }, // 100 points per paid referral
  status: { type: String, enum: ['pending', 'confirmed', 'paid'], default: 'pending' },
  // 'pending' = booking exists but not yet confirmed
  // 'confirmed' = payment successful, points ready to award
  // 'paid' = points added to referrer's account
  
  confirmedAt: { type: Date }, // when payment was confirmed
  awardedAt: { type: Date }, // when points were added to referrer
  
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);