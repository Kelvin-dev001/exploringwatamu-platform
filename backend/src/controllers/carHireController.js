const CarHire = require('../models/CarHire');

// Get all car hires
exports.getCarHires = async (req, res) => {
  const carHires = await CarHire.find();
  res.json(carHires);
};

// Create car hire
exports.createCarHire = async (req, res) => {
  const carHire = new CarHire(req.body);
  await carHire.save();
  res.status(201).json(carHire);
};

// Update car hire
exports.updateCarHire = async (req, res) => {
  const carHire = await CarHire.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(carHire);
};

// Delete car hire
exports.deleteCarHire = async (req, res) => {
  await CarHire.findByIdAndDelete(req.params.id);
  res.json({ message: "Car hire deleted" });
};