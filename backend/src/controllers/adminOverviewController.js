'use strict';

const TripRequest = require('../models/TripRequest');
const GroupBooking = require('../models/GroupBooking');
const GroupTrip = require('../models/GroupTrip');
const PropertyViewingBooking = require('../models/PropertyViewingBooking');
const Tour = require('../models/Tour');
const Notification = require('../models/Notification');
const registry = require('../services/bookingRegistry');

/*
 * GET /api/admin/overview — everything the admin dashboard needs in one call:
 *   todo     what needs action now (new trip requests, pending group bookings, viewings)
 *   money    quotes and confirmed bookings this month, open pipeline, balances due
 *   content  listings that hurt the website (untagged / no photos / drafts / nearly full)
 *   activity latest bookings across all types + failed emails/SMS
 * Months are calendar months in East Africa Time (UTC+3).
 */
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

function monthStart(now = new Date()) {
  const local = new Date(now.getTime() + EAT_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - EAT_OFFSET_MS);
}

const sum = async (Model, match, field) => {
  const [r] = await Model.aggregate([{ $match: match }, { $group: { _id: null, n: { $sum: 1 }, total: { $sum: `$${field}` } } }]);
  return { count: r?.n || 0, value: r?.total || 0 };
};

exports.overview = async (req, res, next) => {
  try {
    const now = new Date();
    const since = monthStart(now);
    const inTwoWeeks = new Date(now.getTime() + 14 * 86400000);
    const today = new Date(now.getTime() - (now.getTime() % 86400000)); // UTC midnight is close enough for "upcoming"
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const [
      newRequests, newRequestCount,
      pendingBookings, pendingBookingCount,
      viewings, viewingCount,
      quotedThisMonth, acceptedThisMonth, openPipeline, quotedEver, acceptedEver,
      confirmedThisMonth, balancesDue,
      untaggedTours, untaggedTourCount, photoLessTours, photoLessTourCount,
      draftTrips, draftTripCount, publishedTrips, untaggedTripCount,
      failedNotes, failedNoteCount,
    ] = await Promise.all([
      TripRequest.find({ status: 'new' }).sort({ createdAt: 1 }).limit(6).lean({ virtuals: true }),
      TripRequest.countDocuments({ status: 'new' }),
      GroupBooking.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(6).populate('trip', 'title startDate slug').lean(),
      GroupBooking.countDocuments({ status: 'pending' }),
      PropertyViewingBooking.find({ status: 'booked', date: { $gte: today, $lte: inTwoWeeks } }).sort({ date: 1, time: 1 }).limit(6).populate('property', 'name').lean(),
      PropertyViewingBooking.countDocuments({ status: 'booked', date: { $gte: today, $lte: inTwoWeeks } }),

      sum(TripRequest, { 'quote.sentAt': { $gte: since } }, 'quote.total'),
      sum(TripRequest, { status: 'accepted', updatedAt: { $gte: since } }, 'quote.total'),
      sum(TripRequest, { status: 'quoted' }, 'quote.total'),
      TripRequest.countDocuments({ 'quote.sentAt': { $ne: null } }),
      TripRequest.countDocuments({ status: 'accepted' }),

      sum(GroupBooking, { status: 'confirmed', updatedAt: { $gte: since } }, 'amountPaid'),
      sum(GroupBooking, { status: 'confirmed', amountDue: { $gt: 0 } }, 'amountDue'),

      Tour.find({ active: true, $or: [{ vibes: { $exists: false } }, { vibes: { $size: 0 } }] }).select('name').limit(5).lean(),
      Tour.countDocuments({ active: true, $or: [{ vibes: { $exists: false } }, { vibes: { $size: 0 } }] }),
      Tour.find({ active: true, $or: [{ gallery: { $exists: false } }, { gallery: { $size: 0 } }] }).select('name').limit(5).lean(),
      Tour.countDocuments({ active: true, $or: [{ gallery: { $exists: false } }, { gallery: { $size: 0 } }] }),

      GroupTrip.find({ status: 'draft' }).select('title startDate').sort({ startDate: 1 }).limit(5).lean(),
      GroupTrip.countDocuments({ status: 'draft' }),
      GroupTrip.find({ status: { $in: ['published', 'full'] }, startDate: { $gte: now } }).select('title startDate maxParticipants confirmedParticipants status slug').lean(),
      GroupTrip.countDocuments({ status: { $in: ['draft', 'published'] }, $or: [{ vibes: { $exists: false } }, { vibes: { $size: 0 } }] }),

      Notification.find({ status: 'failed', createdAt: { $gte: weekAgo } }).sort({ createdAt: -1 }).limit(5).lean(),
      Notification.countDocuments({ status: 'failed', createdAt: { $gte: weekAgo } }),
    ]);

    const nearlyFull = publishedTrips
      .filter((t) => t.maxParticipants > 0 && t.confirmedParticipants / t.maxParticipants >= 0.8)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5)
      .map((t) => ({ id: t._id, title: t.title, startDate: t.startDate, filled: t.confirmedParticipants, capacity: t.maxParticipants, full: t.status === 'full' || t.confirmedParticipants >= t.maxParticipants }));

    // Latest bookings across every type, newest first.
    const recent = (
      await Promise.all(
        Object.values(registry).map(async (entry) => {
          let q = entry.Model.find().sort({ createdAt: -1 }).limit(6);
          entry.populate.forEach((p) => {
            q = q.populate(p);
          });
          return (await q.exec()).map((doc) => ({ ...entry.normalize(doc), label: entry.label }));
        })
      )
    )
      .flat()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);

    const itemCount = (r) => (r.days || []).reduce((n, d) => n + (d.items || []).length, 0) + (r.ideas || []).length;

    res.json({
      generatedAt: now,
      todo: {
        tripRequests: {
          count: newRequestCount,
          items: newRequests.map((r) => ({
            id: r._id, reference: r.reference, name: r.contact?.name, email: r.contact?.email, phone: r.contact?.phone,
            arrival: r.arrival, departure: r.departure, travellers: (r.adults || 0) + (r.children || 0), items: itemCount(r), createdAt: r.createdAt,
          })),
        },
        groupBookings: {
          count: pendingBookingCount,
          items: pendingBookings.map((b) => ({
            id: b._id, name: b.fullName, email: b.email, phone: b.phone, tripId: b.trip?._id, trip: b.trip?.title, startDate: b.trip?.startDate,
            paymentType: b.paymentType, amount: b.amountPaid, createdAt: b.createdAt,
          })),
        },
        viewings: {
          count: viewingCount,
          items: viewings.map((v) => ({ id: v._id, name: v.userName, contact: v.userContact, property: v.property?.name, date: v.date, time: v.time })),
        },
      },
      money: {
        since,
        quotesSent: quotedThisMonth,
        quotesAccepted: acceptedThisMonth,
        openPipeline,
        conversion: quotedEver ? Math.round((acceptedEver / quotedEver) * 100) : null,
        groupBookingsConfirmed: confirmedThisMonth,
        balancesDue,
      },
      content: {
        untaggedTours: { count: untaggedTourCount, items: untaggedTours.map((t) => ({ id: t._id, name: t.name })) },
        toursWithoutPhotos: { count: photoLessTourCount, items: photoLessTours.map((t) => ({ id: t._id, name: t.name })) },
        draftTrips: { count: draftTripCount, items: draftTrips.map((t) => ({ id: t._id, title: t.title, startDate: t.startDate })) },
        untaggedTrips: { count: untaggedTripCount },
        nearlyFull,
      },
      activity: {
        recent,
        failedNotifications: {
          count: failedNoteCount,
          items: failedNotes.map((n) => ({ id: n._id, channel: n.channel, to: n.to, subject: n.subject, event: n.event, error: n.error, createdAt: n.createdAt })),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.monthStart = monthStart;
