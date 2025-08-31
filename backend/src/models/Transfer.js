const mongoose = require('mongoose');

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

module.exports = mongoose.model('Transfer', TransferSchema);