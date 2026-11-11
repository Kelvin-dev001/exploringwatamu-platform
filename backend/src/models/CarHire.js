const mongoose = require('mongoose');

const CarHireSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  dailyRate: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true },
  description: { type: String, default: '' }
}, { timestamps: true });

// Vendor-ready ownership (null = platform-managed).
CarHireSchema.add({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null } });

// Public rating from approved reviews (written only by services/reviewStats).
CarHireSchema.plugin(require('./plugins/reviewStats'));

module.exports = mongoose.model('CarHire', CarHireSchema);