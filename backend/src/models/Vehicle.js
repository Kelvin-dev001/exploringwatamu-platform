const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Sedan"
  image: { type: String }, // Cloudinary URL
  capacity: { type: Number }, // e.g. 4
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);