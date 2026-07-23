'use strict';

const PropertyViewingBooking = require('../models/PropertyViewingBooking');
const PropertyForSale = require('../models/PropertyForSale');
const { paginate, cancelById } = require('../services/bookingService');

// Check if a slot is available.
async function isSlotAvailable(propertyId, date, time) {
  const bookings = await PropertyViewingBooking.find({
    property: propertyId,
    date: new Date(date),
    time,
    status: 'booked',
  });
  return bookings.length === 0;
}

// API: check slot availability.
exports.checkAvailability = async (req, res, next) => {
  try {
    const { propertyId, date, time } = req.body;
    if (!propertyId || !date || !time) return res.status(400).json({ error: 'Missing required fields' });
    const property = await PropertyForSale.findById(propertyId);
    if (!property || !property.active) return res.status(404).json({ error: 'Property not found or inactive' });
    const available = await isSlotAvailable(propertyId, date, time);
    res.json({ available });
  } catch (err) {
    next(err);
  }
};

// User: book a property viewing (with availability check).
exports.bookViewing = async (req, res, next) => {
  try {
    const { propertyId, date, time, userName, userContact } = req.body;
    if (!propertyId || !date || !time || !userName || !userContact) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const property = await PropertyForSale.findById(propertyId);
    if (!property || !property.active) return res.status(404).json({ error: 'Property not found or inactive' });
    const available = await isSlotAvailable(propertyId, date, time);
    if (!available) return res.status(400).json({ error: 'Slot not available' });

    const booking = new PropertyViewingBooking({ property: propertyId, date, time, userName, userContact });
    await booking.save();
    await booking.populate('property');
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// Admin: list bookings with filters + pagination.
exports.getViewingBookings = async (req, res, next) => {
  try {
    const { propertyId, status, dateFrom, dateTo, page, limit } = req.query;
    const query = {};
    if (propertyId) query.property = propertyId;
    if (status) query.status = status;
    if (dateFrom && dateTo) query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };

    const result = await paginate(PropertyViewingBooking, query, { page, limit, populate: ['property'] });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Admin: cancel booking.
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await cancelById(PropertyViewingBooking, req.params.id, { populate: 'property' });
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
