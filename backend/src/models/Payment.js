const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupBooking', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  mpesaReceiptNumber: { type: String },
  transactionDate: { type: String },
  merchantRequestId: { type: String },
  checkoutRequestId: { type: String, required: true, index: true },
  resultCode: { type: Number },
  resultDesc: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
