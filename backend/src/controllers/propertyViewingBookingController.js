const PropertyViewingBooking = require('../models/PropertyViewingBooking');
const PropertyForSale = require('../models/PropertyForSale');

// Check if a slot is available
async function isSlotAvailable(propertyId, date, time) {
  const bookings = await PropertyViewingBooking.find({
    property: propertyId,
    date: new Date(date),
    time,
    status: 'booked'
  });
  return bookings.length === 0;
}

// API: Check slot availability
exports.checkAvailability = async (req, res) => {
  try {
    const { propertyId, date, time } = req.body;
    if (!propertyId || !date || !time) return res.status(400).json({ error: "Missing required fields" });
    const property = await PropertyForSale.findById(propertyId);
    if (!property || !property.active) return res.status(404).json({ error: "Property not found or inactive" });
    const available = await isSlotAvailable(propertyId, date, time);
    res.json({ available });
  } catch (err) {
    res.status(500).json({ error: "Failed to check availability" });
  }
};

// User: Book a property viewing (with availability check)
exports.bookViewing = async (req, res) => {
  try {
    const { propertyId, date, time, userName, userContact } = req.body;
    if (!propertyId || !date || !time || !userName || !userContact) return res.status(400).json({ error: "Missing required fields" });
    const property = await PropertyForSale.findById(propertyId);
    if (!property || !property.active) return res.status(404).json({ error: "Property not found or inactive" });
    const available = await isSlotAvailable(propertyId, date, time);
    if (!available) return res.status(400).json({ error: "Slot not available" });
    const booking = new PropertyViewingBooking({
      property: propertyId,
      date,
      time,
      userName,
      userContact
    });
    await booking.save();
    await booking.populate('property');
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: "Booking failed", details: err.message });
  }
};

// Admin: List bookings with filters and pagination
exports.getViewingBookings = async (req, res) => {
  try {
    const { propertyId, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
    const query = {};
    if (propertyId) query.property = propertyId;
    if (status) query.status = status;
    if (dateFrom && dateTo) {
      query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await PropertyViewingBooking.find(query)
      .populate('property')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await PropertyViewingBooking.countDocuments(query);
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
    const booking = await PropertyViewingBooking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('property');
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};