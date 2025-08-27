const mongoose = require('mongoose');
const TourSchema = new mongoose.Schema({
  title: String,
  description: String,
  images: [String],
  residentPrice: Number,
  nonResidentPrice: Number,
  dates: [String],
});
module.exports = mongoose.model('Tour', TourSchema);