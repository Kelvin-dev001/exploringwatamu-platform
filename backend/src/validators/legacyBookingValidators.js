'use strict';

const { z } = require('zod');

// Public, sign-in-free booking forms from the original MVP: property viewings
// (website), service and car-hire bookings. Field names are unchanged; these
// schemas only make sure every value is the plain string/date/number the
// controllers expect (no query operators, no objects, sane lengths).

const objectId = (label) => z.string().trim().regex(/^[a-f0-9]{24}$/i, `${label} is invalid`);
const day = z.preprocess(
  (v) => (typeof v === 'string' || v instanceof Date ? new Date(v) : v),
  z.date({ error: 'A valid date is required' })
);
// "10:00", "9:30" or "9:30 AM"
const time = z.string().trim().regex(/^\d{1,2}:\d{2}(\s?[AaPp][Mm])?$/, 'A valid time is required (e.g. 10:00)');
const userName = z.string().trim().min(2, 'Please add your name').max(120);
const userContact = z.string().trim().min(5, 'Please add a phone number or email').max(200);
const duration = z.coerce.number().positive('Duration must be positive').max(24 * 14);

const propertyViewingCheckSchema = z.object({ propertyId: objectId('Property'), date: day, time });
const propertyViewingBookSchema = propertyViewingCheckSchema.extend({ userName, userContact });

const serviceCheckSchema = z.object({ serviceId: objectId('Service'), date: day, time, duration });
const serviceBookSchema = serviceCheckSchema.extend({ userName, userContact });

const carHireBookSchema = z
  .object({ carHireId: objectId('Car hire'), startDate: day, endDate: day, userName, userContact })
  .refine((b) => b.endDate >= b.startDate, { path: ['endDate'], message: 'The return date cannot be before the pick-up date' });

module.exports = {
  propertyViewingCheckSchema,
  propertyViewingBookSchema,
  serviceCheckSchema,
  serviceBookSchema,
  carHireBookSchema,
};
