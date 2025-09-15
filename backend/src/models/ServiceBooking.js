const mongoose = require('mongoose');

const TourBookingSchema = new mongoose.Schema({
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }, // if applicable
  date: { type: Date, required: true },
  adults: { type: Number, required: true },
  children: { type: Number, required: true },
  isResident: { type: Boolean, required: true },
  userName: String,
  userContact: String,
  status: { type: String, enum: ["booked", "cancelled"], default: "booked" }
}, { timestamps: true });

module.exports = mongoose.models.TourBooking || mongoose.model('TourBooking', TourBookingSchema);