const mongoose = require('mongoose');
const CarHireSchema = new mongoose.Schema({
  vehicleType: String,
  description: String,
  pricePerDay: Number,
});
module.exports = mongoose.model('CarHire', CarHireSchema);