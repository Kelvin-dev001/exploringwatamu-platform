const mongoose = require('mongoose');

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

module.exports = mongoose.model('PropertyForSale', PropertyForSaleSchema);