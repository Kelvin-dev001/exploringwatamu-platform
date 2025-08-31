const CarHireBooking = require('../models/CarHireBooking');
const CarHire = require('../models/CarHire');
const Vehicle = require('../models/Vehicle');

// Admin: List bookings with filters and pagination
// GET /api/carhirebookings?vehicleId=...&status=booked&startDate=2025-09-01&endDate=2025-09-10&page=1&limit=10
exports.getCarHireBookings = async (req, res) => {
  try {
    const { vehicleId, carHireId, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};
    if (carHireId) query.carHire = carHireId;
    if (vehicleId) {
      // Find carHireIds for that vehicle
      const carHires = await CarHire.find({ vehicle: vehicleId });
      query.carHire = { $in: carHires.map(c => c._id) };
    }
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await CarHireBooking.find(query)
      .populate({ path: 'carHire', populate: { path: 'vehicle' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await CarHireBooking.countDocuments(query);
    res.json({
      data: bookings,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Admin: Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await CarHireBooking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};