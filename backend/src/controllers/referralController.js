const User = require('../models/User');
const Referral = require('../models/Referral');
const GroupBooking = require('../models/GroupBooking');

// GET /my-referrals — Get referral stats for current user
exports.getMyReferrals = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with their safari points
    const user = await User.findById(userId).select('name email safariPoints referralCode');

    // Get all successful referrals
    const referrals = await Referral.find({ referrer: userId, status: 'paid' })
      .populate('referee', 'name email')
      .populate('booking', 'trip')
      .sort({ awardedAt: -1 });

    // Get pending referrals
    const pending = await Referral.find({ referrer: userId, status: 'pending' })
      .populate('referee', 'name email')
      .populate('booking', 'trip');

    res.json({
      user: {
        ...user.toObject(),
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ref/${user.referralCode}`,
        referralsCount: referrals.length,
        pendingCount: pending.length,
      },
      referrals,
      pending,
    });
  } catch (err) {
    console.error('Get referrals error:', err);
    res.status(500).json({ error: 'Failed to fetch referrals.' });
  }
};

// POST /redeem-points — Redeem safari points as discount on next booking
exports.redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    const userId = req.user._id;

    if (!points || points <= 0 || points % 10 !== 0) {
      return res.status(400).json({ error: 'Points must be multiple of 10.' });
    }

    const user = await User.findById(userId);
    if (!user || user.safariPoints < points) {
      return res.status(400).json({ error: 'Insufficient Safari Points.' });
    }

    // Deduct points
    user.safariPoints -= points;
    await user.save();

    // Calculate discount: 10 points = 100 KES
    const discount = (points / 10) * 100;

    res.json({
      message: 'Points redeemed successfully!',
      pointsRedeemed: points,
      discountAmount: discount,
      remainingPoints: user.safariPoints,
    });
  } catch (err) {
    console.error('Redeem points error:', err);
    res.status(500).json({ error: 'Failed to redeem points.' });
  }
};

// POST /apply-code — Apply referral discount before booking
exports.applyReferralDiscount = async (req, res) => {
  try {
    const { referralCode } = req.body;

    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code.' });
    }

    res.json({
      referrer: {
        name: referrer.name,
        avatar: referrer.avatar,
      },
    });
  } catch (err) {
    console.error('Apply referral error:', err);
    res.status(500).json({ error: 'Failed to apply referral code.' });
  }
};