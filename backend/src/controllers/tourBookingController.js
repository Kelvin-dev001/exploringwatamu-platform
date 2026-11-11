'use strict';

const TourBooking = require('../models/TourBooking');
const Tour = require('../models/Tour');
const { paginate, cancelById } = require('../services/bookingService');
const { contains } = require('../services/listQuery');

// Admin: list bookings with filters + pagination.
// GET /api/tourbookings?tourId=&vehicleId=&status=&dateFrom=&dateTo=&name=&page=&limit=
exports.getTourBookings = async (req, res, next) => {
  try {
    const { tourId, vehicleId, status, dateFrom, dateTo, name, page, limit } = req.query;
    const query = {};
    if (tourId) query.tour = tourId;
    if (vehicleId) query.vehicle = vehicleId;
    if (status) query.status = status;
    if (dateFrom && dateTo) query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    const match = contains(name);
    if (match) {
      const tours = await Tour.find({ name: match }).select('_id');
      query.tour = { $in: tours.map((t) => t._id) };
    }

    const result = await paginate(TourBooking, query, {
      page,
      limit,
      populate: [{ path: 'tour', populate: { path: 'vehicles' } }, 'vehicle'],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Admin: cancel booking.
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await cancelById(TourBooking, req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
