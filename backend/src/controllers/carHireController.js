const CarHire = require('../models/CarHire');
const CarHireBooking = require('../models/CarHireBooking');
const Vehicle = require('../models/Vehicle');
const { activeFilter, canSee } = require('../services/listingVisibility');
const { pageParams, pageOf } = require('../services/listQuery');

// Helper: check if a car is available for the requested dates
async function isCarAvailable(carHireId, startDate, endDate) {
  const overlapping = await CarHireBooking.findOne({
    carHire: carHireId,
    status: 'booked',
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  });
  return !overlapping;
}

// GET /api/carhires?vehicleType=Sedan&minPrice=50&maxPrice=300&capacity=4&page=1&limit=10&startDate=2025-09-05&endDate=2025-09-06
exports.getCarHires = async (req, res, next) => {
  try {
    const { vehicleType, minPrice, maxPrice, capacity, startDate, endDate } = req.query;
    const paging = pageParams(req.query);

    // Build filter
    let vehicleQuery = {};
    if (vehicleType) vehicleQuery.name = vehicleType;
    if (capacity) vehicleQuery.capacity = { $gte: parseInt(capacity) };
    const vehicles = await Vehicle.find(vehicleQuery);
    const vehicleIds = vehicles.map(v => v._id);

    let hireQuery = activeFilter(req);
    if (vehicleIds.length) hireQuery.vehicle = { $in: vehicleIds };
    if (minPrice) hireQuery.dailyRate = { ...hireQuery.dailyRate, $gte: parseFloat(minPrice) };
    if (maxPrice) hireQuery.dailyRate = { ...hireQuery.dailyRate, $lte: parseFloat(maxPrice) };

    let carHires = await CarHire.find(hireQuery).populate('vehicle').skip(paging.skip).limit(paging.limit);
    const total = await CarHire.countDocuments(hireQuery);

    // Availability filter (if dates provided)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Filter only available cars
      const availableCarHires = [];
      for (const c of carHires) {
        const available = await isCarAvailable(c._id, start, end);
        if (available) availableCarHires.push(c);
      }
      carHires = availableCarHires;
    }

    res.json(pageOf(carHires, total, paging));
  } catch (err) {
    next(err);
  }
};

// POST /api/carhirebookings
// POST /api/carhire/book (public; body validated by carHireBookSchema)
exports.bookCarHire = async (req, res, next) => {
  try {
    const { carHireId, startDate, endDate, userName, userContact } = req.body;
    // Only cars the public can see can be booked.
    const carHire = await CarHire.findById(carHireId).select('active');
    if (!carHire || !canSee({}, carHire)) return res.status(404).json({ error: 'Car hire not found' });
    const available = await isCarAvailable(carHireId, startDate, endDate);
    if (!available) return res.status(400).json({ error: "Car not available for these dates" });
    const booking = new CarHireBooking({ carHire: carHireId, startDate, endDate, userName, userContact });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// GET /api/carhires/:id
exports.getCarHire = async (req, res, next) => {
  try {
    const carHire = await CarHire.findById(req.params.id).populate('vehicle');
    if (!carHire || !canSee(req, carHire)) return res.status(404).json({ error: 'Car hire not found' });
    res.json(carHire);
  } catch (err) {
    next(err);
  }
};

// POST /api/carhires (Admin)
exports.createCarHire = async (req, res, next) => {
  try {
    const carHire = new CarHire(req.body);
    await carHire.save();
    res.status(201).json(carHire);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create car hire', details: err.message });
  }
};

// PUT /api/carhires/:id (Admin)
exports.updateCarHire = async (req, res, next) => {
  try {
    const carHire = await CarHire.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!carHire) return res.status(404).json({ error: 'Car hire not found' });
    res.json(carHire);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update car hire', details: err.message });
  }
};

// DELETE /api/carhires/:id (Admin)
exports.deleteCarHire = async (req, res, next) => {
  try {
    const carHire = await CarHire.findByIdAndDelete(req.params.id);
    if (!carHire) return res.status(404).json({ error: 'Car hire not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};