const CarHire = require('../models/CarHire');
const CarHireBooking = require('../models/CarHireBooking');
const Vehicle = require('../models/Vehicle');

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
exports.getCarHires = async (req, res) => {
  try {
    let { vehicleType, minPrice, maxPrice, capacity, page = 1, limit = 10, startDate, endDate } = req.query;
    page = parseInt(page); limit = parseInt(limit);

    // Build filter
    let vehicleQuery = {};
    if (vehicleType) vehicleQuery.name = vehicleType;
    if (capacity) vehicleQuery.capacity = { $gte: parseInt(capacity) };
    const vehicles = await Vehicle.find(vehicleQuery);
    const vehicleIds = vehicles.map(v => v._id);

    let hireQuery = { active: true };
    if (vehicleIds.length) hireQuery.vehicle = { $in: vehicleIds };
    if (minPrice) hireQuery.dailyRate = { ...hireQuery.dailyRate, $gte: parseFloat(minPrice) };
    if (maxPrice) hireQuery.dailyRate = { ...hireQuery.dailyRate, $lte: parseFloat(maxPrice) };

    // Pagination
    const skip = (page - 1) * limit;
    let carHires = await CarHire.find(hireQuery).populate('vehicle').skip(skip).limit(limit);
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

    res.json({
      data: carHires,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch car hires' });
  }
};

// POST /api/carhirebookings
exports.bookCarHire = async (req, res) => {
  try {
    const { carHireId, startDate, endDate, userName, userContact } = req.body;
    const available = await isCarAvailable(carHireId, new Date(startDate), new Date(endDate));
    if (!available) return res.status(400).json({ error: "Car not available for these dates" });
    const booking = new CarHireBooking({ carHire: carHireId, startDate, endDate, userName, userContact });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: "Booking failed", details: err.message });
  }
};