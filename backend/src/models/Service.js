const mongoose = require('mongoose');

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

module.exports = mongoose.model('Service', ServiceSchema);