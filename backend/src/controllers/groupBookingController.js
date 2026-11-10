'use strict';

const GroupBooking = require('../models/GroupBooking');
const GroupTrip = require('../models/GroupTrip');
const User = require('../models/User');
const Referral = require('../models/Referral');
const config = require('../config/env');
const {
  notifyBookingRequested,
  notifyBookingConfirmed,
  notifyBookingCancelled,
} = require('../services/bookingNotifications');
const { deliveryFor } = require('../services/notifications/delivery');

// Fire-and-forget email helper: never let an email failure break the request.
function sendAsync(promiseFactory, label) {
  Promise.resolve()
    .then(promiseFactory)
    .catch((err) => console.error(`[email] ${label} failed:`, err.message));
}

// POST /join — Create a pending booking with vibe data (authUser required).
// Input is validated upstream by validate(joinTripSchema).
exports.joinTrip = async (req, res, next) => {
  try {
    const {
      tripId,
      paymentType,
      fullName,
      email,
      phone,
      travelPersonalities,
      travelGroup,
      selectedAvatar,
      referredByCode,
    } = req.body;

    const trip = await GroupTrip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Group trip not found.' });
    if (trip.status !== 'published') {
      return res.status(400).json({ error: 'This trip is not available for booking.' });
    }
    if (trip.confirmedParticipants >= trip.maxParticipants) {
      return res.status(400).json({ error: 'This trip is full.' });
    }

    const amountPaid = paymentType === 'full' ? trip.fullPrice : trip.depositAmount;
    const amountDue = paymentType === 'full' ? 0 : trip.fullPrice - trip.depositAmount;

    const booking = new GroupBooking({
      trip: trip._id,
      user: req.user._id,
      fullName,
      email,
      phone,
      paymentType,
      amountPaid,
      amountDue,
      status: 'pending',
      travelPersonalities,
      travelGroup,
      selectedAvatar: selectedAvatar || 'avatar_1.png',
    });

    if (referredByCode) {
      const referrer = await User.findOne({ referralCode: referredByCode });
      if (referrer) booking.referredBy = referrer._id;
    }

    await booking.save();
    booking.eCardUrl = `${config.frontendUrl}/ecard/${booking._id}`;
    await booking.save();

    // Email the traveller (with quotation) and notify admin — non-blocking.
    sendAsync(() => notifyBookingRequested(booking, trip), 'booking-requested');

    res.status(201).json({ booking, amountPaid });
  } catch (err) {
    next(err);
  }
};

// POST /confirm — Admin confirms a booking (admin-approve flow while payments
// are disabled). Slot is claimed atomically to prevent overselling.
exports.confirmBooking = async (req, res, next) => {
  try {
    const { bookingId, mpesaReceiptNumber } = req.body || {};
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required.' });

    // Move pending -> confirmed atomically first, so a double tap (or two admins)
    // can only confirm — and take a seat for — a booking once.
    const booking = await GroupBooking.findOneAndUpdate(
      { _id: bookingId, status: 'pending' },
      { $set: { status: 'confirmed' } },
      { new: true }
    );
    if (!booking) {
      const current = await GroupBooking.findById(bookingId).select('status');
      if (!current) return res.status(404).json({ error: 'Booking not found.' });
      return res.status(400).json({ error: current.status === 'cancelled' ? 'Cannot confirm a cancelled booking.' : 'Booking already confirmed.' });
    }

    // Atomically claim a slot only if capacity remains; otherwise undo the confirm.
    const trip = await GroupTrip.findOneAndUpdate(
      { _id: booking.trip, $expr: { $lt: ['$confirmedParticipants', '$maxParticipants'] } },
      { $inc: { confirmedParticipants: 1 } },
      { new: true }
    );
    if (!trip) {
      await GroupBooking.updateOne({ _id: booking._id, status: 'confirmed' }, { $set: { status: 'pending' } });
      return res.status(400).json({ error: 'This trip is full.' });
    }

    if (trip.confirmedParticipants >= trip.maxParticipants && trip.status !== 'full') {
      trip.status = 'full';
      await trip.save();
    }

    if (mpesaReceiptNumber) {
      booking.mpesaReceiptNumber = mpesaReceiptNumber;
      await booking.save();
    }

    // Award referral points to the referrer, if any.
    if (booking.referredBy) {
      const referrer = await User.findById(booking.referredBy);
      if (referrer) {
        const referral = new Referral({
          referrer: booking.referredBy,
          referee: booking.user,
          booking: booking._id,
          pointsAwarded: 100,
          status: 'confirmed',
          confirmedAt: new Date(),
        });
        await referral.save();

        referrer.safariPoints = (referrer.safariPoints || 0) + 100;
        await referrer.save();

        referral.status = 'paid';
        referral.awardedAt = new Date();
        await referral.save();
      }
    }

    // Email the traveller a confirmation + receipt — non-blocking.
    sendAsync(() => notifyBookingConfirmed(booking, trip), 'booking-confirmed');

    res.json({ booking, delivery: deliveryFor(booking) });
  } catch (err) {
    next(err);
  }
};

// PUT /admin/:id/cancel — Admin cancels a booking, releasing a seat if it was
// confirmed, and notifies the traveller.
exports.cancelBookingAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Cancel atomically and read the status it had, so two cancels of one
    // confirmed booking can't release its seat twice.
    const before = await GroupBooking.findOneAndUpdate(
      { _id: id, status: { $ne: 'cancelled' } },
      { $set: { status: 'cancelled' } },
      { new: false }
    );
    if (!before) {
      const exists = await GroupBooking.exists({ _id: id });
      if (!exists) return res.status(404).json({ error: 'Booking not found.' });
      return res.status(400).json({ error: 'Booking is already cancelled.' });
    }

    const booking = await GroupBooking.findById(id).populate('trip');
    const tripDoc = booking.trip; // populated document (for the email)
    const wasConfirmed = before.status === 'confirmed';

    // Release the seat and re-open a full trip if it was confirmed.
    if (wasConfirmed && tripDoc) {
      const updated = await GroupTrip.findOneAndUpdate(
        { _id: tripDoc._id, confirmedParticipants: { $gt: 0 } },
        { $inc: { confirmedParticipants: -1 } },
        { new: true }
      );
      if (updated && updated.status === 'full' && updated.confirmedParticipants < updated.maxParticipants) {
        updated.status = 'published';
        await updated.save();
      }
    }

    sendAsync(() => notifyBookingCancelled(booking, tripDoc), 'booking-cancelled');

    res.json({ booking, delivery: deliveryFor(booking) });
  } catch (err) {
    next(err);
  }
};

// GET /my-bookings — bookings for the current user (authUser required)
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await GroupBooking.find({ user: req.user._id })
      .populate('trip', 'title heroImage startDate endDate meetingPoint fullPrice depositAmount balanceDueDate slug')
      .populate('referredBy', 'name avatar travelPersonalities')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// GET /trip/:tripId/participants — confirmed participants for a trip (public)
exports.getTripParticipants = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const bookings = await GroupBooking.find({ trip: tripId, status: 'confirmed' })
      .populate('user', 'name avatar')
      .select('user travelPersonalities travelGroup selectedAvatar createdAt')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// GET /admin/all — all bookings (authAdmin required)
exports.getAllBookingsAdmin = async (req, res, next) => {
  try {
    const bookings = await GroupBooking.find()
      .populate('trip', 'title startDate endDate')
      .populate('user', 'name email')
      .populate('referredBy', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// GET /admin/trip/:tripId — bookings for a specific trip (authAdmin required)
exports.getBookingsByTripAdmin = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const bookings = await GroupBooking.find({ trip: tripId })
      .populate('trip', 'title startDate endDate')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};
