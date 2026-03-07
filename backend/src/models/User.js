const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  
  // NEW: Travel profile data (vibe selection)
  travelPersonalities: [{ type: String }], // e.g., ['Party Starter', 'Music Lover']
  travelGroup: { type: String }, // e.g., 'Solo But Social'
  selectedAvatar: { type: String }, // e.g., 'avatar_1.png'
  
  // NEW: Safari Points for referrals
  safariPoints: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true }, // slug-based like 'sarah-smith'
}, { timestamps: true });

// Generate referral code from name (slug format)
userSchema.pre('save', function(next) {
  if (!this.referralCode && this.name) {
    this.referralCode = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      + '-' + Math.random().toString(36).substring(7);
  }
  next();
});

userSchema.methods.setPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);