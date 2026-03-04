const mongoose = require('mongoose');

const itineraryDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  activities: [{ type: String }],
}, { _id: false });

const groupTripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  heroImage: { type: String },
  gallery: [{ type: String }],
  shortDescription: { type: String, required: true },
  fullDescription: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  meetingPoint: { type: String },
  itinerary: [itineraryDaySchema],
  includes: [{ type: String }],
  excludes: [{ type: String }],
  accommodationDetails: { type: String },
  maxParticipants: { type: Number, required: true },
  confirmedParticipants: { type: Number, default: 0 },
  fullPrice: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  balanceDueDate: { type: Date },
  status: { type: String, enum: ['draft', 'published', 'full', 'closed'], default: 'draft' },
}, { timestamps: true });

// Virtual: slotsRemaining
groupTripSchema.virtual('slotsRemaining').get(function () {
  return this.maxParticipants - this.confirmedParticipants;
});

groupTripSchema.set('toJSON', { virtuals: true });
groupTripSchema.set('toObject', { virtuals: true });

// Pre-save: auto-set status to 'full' if confirmedParticipants >= maxParticipants
groupTripSchema.pre('save', function (next) {
  if (this.confirmedParticipants >= this.maxParticipants) {
    this.status = 'full';
  }
  next();
});

// Pre-validate: auto-generate slug from title
groupTripSchema.pre('validate', function (next) {
  if (this.isNew || this.isModified('title')) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const suffix = Math.random().toString(36).substring(2, 6);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

module.exports = mongoose.model('GroupTrip', groupTripSchema);
