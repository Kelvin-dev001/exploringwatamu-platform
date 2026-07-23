'use strict';

const { z } = require('zod');

const joinTripSchema = z.object({
  tripId: z.string().trim().min(1, 'tripId is required'),
  paymentType: z.enum(['deposit', 'full']),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'A valid email is required'),
  phone: z.string().trim().min(7, 'A valid phone number is required').max(30),
  travelPersonalities: z
    .array(z.string().trim().min(1))
    .min(1, 'Select 1-3 personalities')
    .max(3, 'Select at most 3 personalities'),
  travelGroup: z.string().trim().min(1, 'Travel group is required'),
  selectedAvatar: z.string().trim().optional(),
  referredByCode: z.string().trim().optional(),
});

module.exports = { joinTripSchema };
