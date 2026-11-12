const mongoose = require('mongoose');
const { ITALIAN_FIELDS } = require('../constants/italianContent');

const TransferSchema = new mongoose.Schema({
  route: {
    type: String,
    enum: [
      'SGR-Watamu',
      'Moi International Airport-Watamu',
      'Malindi-Watamu',
      'Mombasa-Watamu',
      'Diani-Watamu'
    ],
    required: true,
  },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true }, // Reference to Vehicle
  price: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true },
  description: { type: String, default: '' }
}, { timestamps: true });

// Vendor-ready ownership (null = platform-managed).
TransferSchema.add({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null } });

// Public rating from approved reviews (written only by services/reviewStats).
TransferSchema.plugin(require('./plugins/reviewStats'));


// Optional Italian text, written by the team (constants/italianContent.js).
TransferSchema.plugin(require('./plugins/italianContent'), { fields: ITALIAN_FIELDS.transfer });

module.exports = mongoose.model('Transfer', TransferSchema);