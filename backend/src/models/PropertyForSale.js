const mongoose = require('mongoose');
const { ITALIAN_FIELDS } = require('../constants/italianContent');

const PropertyForSaleSchema = new mongoose.Schema({
  type: { type: String, enum: ["villa", "apartment", "land"], required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  pictures: [{ type: String }], // array of image URLs
  documents: [{ type: String }], // array of doc URLs (PDF, images)
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Vendor-ready ownership (null = platform-managed).
PropertyForSaleSchema.add({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null } });


// Optional Italian text, written by the team (constants/italianContent.js).
PropertyForSaleSchema.plugin(require('./plugins/italianContent'), { fields: ITALIAN_FIELDS.property });

module.exports = mongoose.model('PropertyForSale', PropertyForSaleSchema);