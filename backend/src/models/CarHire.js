const mongoose = require('mongoose');

const CarHireSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  dailyRate: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CarHire', CarHireSchema);