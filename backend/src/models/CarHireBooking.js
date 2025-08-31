const mongoose = require('mongoose');

const CarHireBookingSchema = new mongoose.Schema({
  carHire: { type: mongoose.Schema.Types.ObjectId, ref: 'CarHire', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  userName: String,
  userContact: String,
  status: { type: String, enum: ["booked", "cancelled"], default: "booked" }
}, { timestamps: true });

module.exports = mongoose.model('CarHireBooking', CarHireBookingSchema);