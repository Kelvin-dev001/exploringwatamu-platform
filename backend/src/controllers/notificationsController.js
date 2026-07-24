'use strict';

const Notification = require('../models/Notification');
const { paginate } = require('../services/bookingService');

// GET /api/notifications?channel=&status=&event=&page=&limit= (admin)
exports.list = async (req, res, next) => {
  try {
    const { channel, status, event, page, limit } = req.query;
    const query = {};
    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (event) query.event = event;

    const result = await paginate(Notification, query, {
      page,
      limit,
      populate: [{ path: 'user', select: 'name email' }],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
