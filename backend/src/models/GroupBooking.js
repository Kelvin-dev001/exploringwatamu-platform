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
}, { timestamps: true });

module.exports = mongoose.model('GroupBooking', groupBookingSchema);
