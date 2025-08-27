const Tour = require('../models/Tour');

// Get all tours
exports.getTours = async (req, res) => {
  const tours = await Tour.find();
  res.json(tours);
};

// Create tour
exports.createTour = async (req, res) => {
  const tour = new Tour(req.body);
  await tour.save();
  res.status(201).json(tour);
};

// Update tour
exports.updateTour = async (req, res) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(tour);
};

// Delete tour
exports.deleteTour = async (req, res) => {
  await Tour.findByIdAndDelete(req.params.id);
  res.json({ message: "Tour deleted" });
};