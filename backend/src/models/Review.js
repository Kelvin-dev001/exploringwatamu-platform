const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  accommodationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accommodation', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Review', reviewSchema);