const mongoose = require('mongoose');
const { ITALIAN_FIELDS } = require('../constants/italianContent');
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

// Vendor-ready ownership (null = platform-managed).
TourSchema.add({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null } });

// Discovery tags for personalised matching (vibes, suits, energy, durationHours).
TourSchema.plugin(require('./plugins/discovery'));

// Public rating from approved reviews (written only by services/reviewStats).
TourSchema.plugin(require('./plugins/reviewStats'));


// Optional Italian text, written by the team (constants/italianContent.js).
TourSchema.plugin(require('./plugins/italianContent'), { fields: ITALIAN_FIELDS.tour });

module.exports = mongoose.model('Tour', TourSchema);