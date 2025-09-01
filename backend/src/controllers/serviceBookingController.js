const ServiceBooking = require('../models/ServiceBooking');
const Service = require('../models/Service');

// Check if a slot is available
async function isSlotAvailable(serviceId, date, time, duration) {
  // Find overlapping bookings (exact time for now, can extend for partial overlap)
  const bookings = await ServiceBooking.find({
    service: serviceId,
    date: new Date(date),
    status: 'booked',
    time
  });
  return bookings.length === 0; // Available if no overlapping booking
}

// API: Check slot availability (for instant UX)
exports.checkAvailability = async (req, res) => {
  try {
    const { serviceId, date, time, duration } = req.body;
    if (!serviceId || !date || !time || !duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Optional: Check if service exists and is active
    const service = await Service.findById(serviceId);
    if (!service || !service.active) {
      return res.status(404).json({ error: "Service not found or inactive" });
    }
    const available = await isSlotAvailable(serviceId, date, time, duration);
    res.json({ available });
  } catch (err) {
    res.status(500).json({ error: "Failed to check availability" });
  }
};

// User: Make a booking (with availability check)
exports.bookService = async (req, res) => {
  try {
    const { serviceId, date, time, duration, userName, userContact } = req.body;
    if (!serviceId || !date || !time || !duration || !userName || !userContact) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Check service exists and active
    const service = await Service.findById(serviceId);
    if (!service || !service.active) {
      return res.status(404).json({ error: "Service not found or inactive" });
    }
    const available = await isSlotAvailable(serviceId, date, time, duration);
    if (!available) return res.status(400).json({ error: "Slot not available" });
    const booking = new ServiceBooking({
      service: serviceId,
      date,
      time,
      duration,
      userName,
      userContact
    });
    await booking.save();
    // Populate service for response
    await booking.populate('service');
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: "Booking failed", details: err.message });
  }
};

// Admin: List bookings with filters and pagination
exports.getServiceBookings = async (req, res) => {
  try {
    const { serviceId, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
    const query = {};
    if (serviceId) query.service = serviceId;
    if (status) query.status = status;
    if (dateFrom && dateTo) {
      query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await ServiceBooking.find(query)
      .populate('service')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await ServiceBooking.countDocuments(query);
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
    const booking = await ServiceBooking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('service');
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};