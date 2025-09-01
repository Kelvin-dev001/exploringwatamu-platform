const Tour = require('../models/Tour');
const Vehicle = require('../models/Vehicle');

// List tours with pagination, advanced search & filters
// GET /api/tours?name=dolphin&active=true&vehicleId=...&page=1&limit=10
exports.getTours = async (req, res) => {
  try {
    const { name, active, vehicleId, page = 1, limit = 10 } = req.query;
    let query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (active !== undefined) query.active = active === "true" || active === true;
    if (vehicleId) query.vehicles = vehicleId;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tours = await Tour.find(query)
      .populate('vehicles')
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Tour.countDocuments(query);
    res.json({
      data: tours,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
};

// Single tour
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('vehicles');
    if (!tour) return res.status(404).json({ error: 'Not found' });
    res.json(tour);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tour' });
  }
};

// Admin: Create tour
exports.createTour = async (req, res) => {
  try {
    const tour = new Tour(req.body);
    await tour.save();
    res.status(201).json(await tour.populate('vehicles'));
  } catch (err) {
    res.status(400).json({ error: 'Failed to create tour', details: err.message });
  }
};

// Admin: Update tour
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('vehicles');
    if (!tour) return res.status(404).json({ error: 'Not found' });
    res.json(tour);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update tour', details: err.message });
  }
};

// Admin: Delete tour
exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Tour deleted" });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete tour' });
  }
};