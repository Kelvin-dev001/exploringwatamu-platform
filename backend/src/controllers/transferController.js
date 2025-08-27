const Transfer = require('../models/Transfer');

// Get all transfers
exports.getTransfers = async (req, res) => {
  const transfers = await Transfer.find();
  res.json(transfers);
};

// Create transfer
exports.createTransfer = async (req, res) => {
  const transfer = new Transfer(req.body);
  await transfer.save();
  res.status(201).json(transfer);
};

// Update transfer
exports.updateTransfer = async (req, res) => {
  const transfer = await Transfer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(transfer);
};

// Delete transfer
exports.deleteTransfer = async (req, res) => {
  await Transfer.findByIdAndDelete(req.params.id);
  res.json({ message: "Transfer deleted" });
};