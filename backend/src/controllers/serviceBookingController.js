'use strict';

const ServiceBooking = require('../models/ServiceBooking');
const Service = require('../models/Service');
const { paginate, cancelById } = require('../services/bookingService');

// Check if a slot is available (exact date+time match for now).
async function isSlotAvailable(serviceId, date, time) {
  const bookings = await ServiceBooking.find({
    service: serviceId,
    date: new Date(date),
    status: 'booked',
    time,
  });
  return bookings.length === 0;
}

// API: check slot availability (instant UX).
exports.checkAvailability = async (req, res, next) => {
  try {
    const { serviceId, date, time, duration } = req.body;
    if (!serviceId || !date || !time || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const service = await Service.findById(serviceId);
    if (!service || !service.active) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }
    const available = await isSlotAvailable(serviceId, date, time);
    res.json({ available });
  } catch (err) {
    next(err);
  }
};

// User: make a booking (with availability check).
exports.bookService = async (req, res, next) => {
  try {
    const { serviceId, date, time, duration, userName, userContact } = req.body;
    if (!serviceId || !date || !time || !duration || !userName || !userContact) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const service = await Service.findById(serviceId);
    if (!service || !service.active) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }
    const available = await isSlotAvailable(serviceId, date, time);
    if (!available) return res.status(400).json({ error: 'Slot not available' });

    const booking = new ServiceBooking({ service: serviceId, date, time, duration, userName, userContact });
    await booking.save();
    await booking.populate('service');
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// Admin: list bookings with filters + pagination.
exports.getServiceBookings = async (req, res, next) => {
  try {
    const { serviceId, status, dateFrom, dateTo, page, limit } = req.query;
    const query = {};
    if (serviceId) query.service = serviceId;
    if (status) query.status = status;
    if (dateFrom && dateTo) query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };

    const result = await paginate(ServiceBooking, query, { page, limit, populate: ['service'] });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Admin: cancel booking.
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await cancelById(ServiceBooking, req.params.id, { populate: 'service' });
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
