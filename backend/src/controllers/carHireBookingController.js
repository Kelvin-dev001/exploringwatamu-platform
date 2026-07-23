'use strict';

const CarHireBooking = require('../models/CarHireBooking');
const CarHire = require('../models/CarHire');
const { paginate, cancelById } = require('../services/bookingService');

// Admin: list bookings with filters + pagination.
// GET /api/carhirebookings?vehicleId=&carHireId=&status=&startDate=&endDate=&page=&limit=
exports.getCarHireBookings = async (req, res, next) => {
  try {
    const { vehicleId, carHireId, status, startDate, endDate, page, limit } = req.query;
    const query = {};
    if (carHireId) query.carHire = carHireId;
    if (vehicleId) {
      const carHires = await CarHire.find({ vehicle: vehicleId }).select('_id');
      query.carHire = { $in: carHires.map((c) => c._id) };
    }
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const result = await paginate(CarHireBooking, query, {
      page,
      limit,
      populate: [{ path: 'carHire', populate: { path: 'vehicle' } }],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Admin: cancel booking.
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await cancelById(CarHireBooking, req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
