const mongoose = require('mongoose');

const PropertyViewingBookingSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyForSale', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // "HH:MM"
  userName: String,
  userContact: String,
  status: { type: String, enum: ["booked", "cancelled"], default: "booked" }
}, { timestamps: true });

module.exports = mongoose.model('PropertyViewingBooking', PropertyViewingBookingSchema);