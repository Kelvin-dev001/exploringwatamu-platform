const mongoose = require('mongoose');

const PropertyViewingBookingSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyForSale', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // "HH:MM"
  userName: String,
  userContact: String,
  status: { type: String, enum: ["booked", "cancelled"], default: "booked" }
}, { timestamps: true });

// Slot check for a viewing; upcoming viewings on the dashboard.
PropertyViewingBookingSchema.index({ property: 1, date: 1, time: 1 });
PropertyViewingBookingSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('PropertyViewingBooking', PropertyViewingBookingSchema);