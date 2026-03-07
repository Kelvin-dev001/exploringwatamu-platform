const GroupBooking = require('../models/GroupBooking');
const GroupTrip = require('../models/GroupTrip');
const User = require('../models/User');
const Referral = require('../models/Referral');

// POST /join — Create a booking with vibe data (authUser required)
exports.joinTrip = async (req, res) => {
  try {
    const { tripId, paymentType, fullName, email, phone, travelPersonalities, travelGroup, selectedAvatar, referredByCode } = req.body;

    if (!tripId || !paymentType || !fullName || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!travelPersonalities || travelPersonalities.length === 0 || travelPersonalities.length > 3) {
      return res.status(400).json({ error: 'Select 1-3 personalities.' });
    }

    if (!travelGroup) {
      return res.status(400).json({ error: 'Travel group selection is required.' });
    }

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

    // Handle referral if provided
    if (referredByCode) {
      const referrer = await User.findOne({ referralCode: referredByCode });
      if (referrer) {
        booking.referredBy = referrer._id;
      }
    }

    await booking.save();

    // Generate e-card URL for sharing
    const eCardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ecard/${booking._id}`;
    booking.eCardUrl = eCardUrl;
    await booking.save();

    res.status(201).json({ booking, amountPaid });
  } catch (err) {
    console.error('Join trip error:', err);
    res.status(500).json({ error: 'Failed to create booking.', details: err.message });
  }
};

// POST /confirm — Called after successful M-Pesa payment to confirm booking
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId, mpesaReceiptNumber } = req.body;

    const booking = await GroupBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.status === 'confirmed') {
      return res.status(400).json({ error: 'Booking already confirmed.' });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.mpesaReceiptNumber = mpesaReceiptNumber;
    await booking.save();

    // Increment trip confirmed participants
    const trip = await GroupTrip.findById(booking.trip);
    trip.confirmedParticipants += 1;
    if (trip.confirmedParticipants >= trip.maxParticipants) {
      trip.status = 'full';
    }
    await trip.save();

    // If this booking has a referrer, create a referral record and award points
    if (booking.referredBy) {
      const referral = new Referral({
        referrer: booking.referredBy,
        referee: booking.user,
        booking: booking._id,
        pointsAwarded: 100,
        status: 'confirmed',
        confirmedAt: new Date(),
      });
      await referral.save();

      // Award points to referrer
      const referrer = await User.findById(booking.referredBy);
      referrer.safariPoints = (referrer.safariPoints || 0) + 100;
      await referrer.save();

      // Update referral status to 'paid'
      referral.status = 'paid';
      referral.awardedAt = new Date();
      await referral.save();
    }

    res.json({ booking });
  } catch (err) {
    console.error('Confirm booking error:', err);
    res.status(500).json({ error: 'Failed to confirm booking.', details: err.message });
  }
};

// GET /my-bookings — Get all bookings for current user (authUser required)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await GroupBooking.find({ user: req.user._id })
      .populate('trip', 'title heroImage startDate endDate meetingPoint fullPrice depositAmount balanceDueDate slug')
      .populate('referredBy', 'name avatar travelPersonalities')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

// GET /trip/:tripId/participants — Get all confirmed participants for a trip (public)
exports.getTripParticipants = async (req, res) => {
  try {
    const { tripId } = req.params;

    const bookings = await GroupBooking.find({ trip: tripId, status: 'confirmed' })
      .populate('user', 'name avatar')
      .select('user travelPersonalities travelGroup selectedAvatar createdAt')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch participants.' });
  }
};

// GET /admin/all — Get all bookings (authAdmin required)
exports.getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await GroupBooking.find()
      .populate('trip', 'title startDate endDate')
      .populate('user', 'name email')
      .populate('referredBy', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

// GET /admin/trip/:tripId — Get bookings for a specific trip (authAdmin required)
exports.getBookingsByTripAdmin = async (req, res) => {
  try {
    const { tripId } = req.params;
    const bookings = await GroupBooking.find({ trip: tripId })
      .populate('trip', 'title startDate endDate')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};