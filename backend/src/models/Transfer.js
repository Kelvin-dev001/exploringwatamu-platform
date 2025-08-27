const mongoose = require('mongoose');
const TransferSchema = new mongoose.Schema({
  route: String,
  vehicleType: String,
  price: Number,
});
module.exports = mongoose.model('Transfer', TransferSchema);