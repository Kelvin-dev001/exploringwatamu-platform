const mongoose = require('mongoose');
const { ITALIAN_FIELDS } = require('../constants/italianContent');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Babysitting", "Chef on Demand"
  description: { type: String, required: true },
  pricingType: { type: String, enum: ["hourly", "daily"], required: true }, // "hourly" or "daily"
  price: { type: Number, required: true },
  availableDays: [{ type: String }], // e.g. ["Monday", "Tuesday", ...]
  availableHours: { start: String, end: String }, // e.g. {start: "08:00", end: "18:00"}
  gallery: [{ type: String }], // image URLs
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Vendor-ready ownership (null = platform-managed).
ServiceSchema.add({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null } });

// Public rating from approved reviews (written only by services/reviewStats).
ServiceSchema.plugin(require('./plugins/reviewStats'));


// Optional Italian text, written by the team (constants/italianContent.js).
ServiceSchema.plugin(require('./plugins/italianContent'), { fields: ITALIAN_FIELDS.service });

module.exports = mongoose.model('Service', ServiceSchema);