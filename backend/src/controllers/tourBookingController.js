const TourBooking = require('../models/TourBooking');
const Tour = require('../models/Tour');
const Vehicle = require('../models/Vehicle');

// Admin: List bookings with filters and pagination
// GET /api/tourbookings?tourId=...&vehicleId=...&status=booked&dateFrom=2025-10-01&dateTo=2025-10-10&name=Safari&page=1&limit=10
exports.getTourBookings = async (req, res) => {
  try {
    const { tourId, vehicleId, status, dateFrom, dateTo, name, page = 1, limit = 10 } = req.query;
    const query = {};
    if (tourId) query.tour = tourId;
    if (vehicleId) query.vehicle = vehicleId;
    if (status) query.status = status;
    if (dateFrom && dateTo) {
      query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }
    // Advanced search by tour name
    if (name) {
      const tours = await Tour.find({ name: { $regex: name, $options: "i" } });
      query.tour = { $in: tours.map(t => t._id) };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await TourBooking.find(query)
      .populate({ path: 'tour', populate: { path: 'vehicles' } })
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await TourBooking.countDocuments(query);
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
    const booking = await TourBooking.findByIdAndUpdate(
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