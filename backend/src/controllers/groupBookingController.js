const GroupBooking = require('../models/GroupBooking');
const GroupTrip = require('../models/GroupTrip');

// POST /join — Create a booking (authUser required)
exports.joinTrip = async (req, res) => {
  try {
    const { tripId, paymentType, fullName, email, phone } = req.body;

    if (!tripId || !paymentType || !fullName || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required.' });
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
    });
    await booking.save();

    res.status(201).json({ booking, amountPaid });
  } catch (err) {
    console.error('Join trip error:', err);
    res.status(500).json({ error: 'Failed to create booking.', details: err.message });
  }
};

// GET /my-bookings — Get all bookings for current user (authUser required)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await GroupBooking.find({ user: req.user._id })
      .populate('trip', 'title heroImage startDate endDate meetingPoint fullPrice depositAmount balanceDueDate slug')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};
