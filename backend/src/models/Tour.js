const mongoose = require('mongoose');
const TourSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Watamu Dolphin Tour"
  description: { type: String, required: true },
  recommendedTimes: { type: String }, // e.g. "June - September"
  highlights: [{ type: String }],     // List of things to enjoy
  duration: { type: String },         // e.g. "Full Day", "Half Day", "2 Days"
  whatToCarry: [{ type: String }],    // e.g. ["Sunscreen", "Water bottle"]
  gallery: [{ type: String }],        // Array of image URLs
  vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }], // optional vehicles for tour
  priceResidentAdult: { type: Number, required: true },
  priceResidentChild: { type: Number, required: true },
  priceForeignerAdult: { type: Number, required: true },
  priceForeignerChild: { type: Number, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Tour', TourSchema);