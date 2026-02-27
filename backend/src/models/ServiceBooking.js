const mongoose = require('mongoose');

const ServiceBookingSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: Date, required: true },
  time: { type: String },
  duration: { type: Number },
  userName: String,
  userContact: String,
  status: { type: String, enum: ["booked", "cancelled"], default: "booked" }
}, { timestamps: true });

module.exports = mongoose.model('ServiceBooking', ServiceBookingSchema);