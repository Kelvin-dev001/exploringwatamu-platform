'use strict';

const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');

/*
 * PATCH /api/admin/quick/:resource/:id — small inline edits from admin lists
 * (publish/hide, price, mark a trip full). Only whitelisted fields are
 * accepted and only those keys are $set, so nothing else on the listing can
 * be wiped — unlike the full PUT update endpoints.
 */
const router = express.Router();

const price = z.coerce.number({ error: 'Price must be a number' }).min(0, 'Price can’t be negative').max(1e9);
const flag = z.boolean();

const RESOURCES = {
  tours: {
    model: () => require('../models/Tour'),
    schema: z.object({ active: flag, priceForeignerAdult: price, priceResidentAdult: price, priceForeignerChild: price, priceResidentChild: price }).partial(),
  },
  grouptrips: {
    model: () => require('../models/GroupTrip'),
    schema: z.object({ status: z.enum(['draft', 'published', 'full', 'closed']), fullPrice: price, depositAmount: price, maxParticipants: z.coerce.number().int().min(1) }).partial(),
    check: (doc, patch) => {
      const full = patch.fullPrice ?? doc.fullPrice;
      const deposit = patch.depositAmount ?? doc.depositAmount;
      if (deposit > full) return 'Deposit can’t be more than the full price.';
      if (patch.maxParticipants !== undefined && patch.maxParticipants < (doc.confirmedParticipants || 0)) {
        return `There are already ${doc.confirmedParticipants} confirmed travellers.`;
      }
      return null;
    },
  },
  hotels: { model: () => require('../models/Hotel'), schema: z.object({ pricePerNight: price }).partial() },
  transfers: { model: () => require('../models/Transfer'), schema: z.object({ active: flag, price }).partial() },
  carhire: { model: () => require('../models/CarHire'), schema: z.object({ active: flag, dailyRate: price }).partial() },
  services: { model: () => require('../models/Service'), schema: z.object({ active: flag, price }).partial() },
  properties: { model: () => require('../models/PropertyForSale'), schema: z.object({ active: flag, price }).partial() },
};

router.patch('/:resource/:id', (req, res, next) => {
  const r = RESOURCES[req.params.resource];
  if (!r) return res.status(404).json({ error: `Quick edits aren’t available for ${req.params.resource}.` });
  return validate(r.schema.strict({ error: 'That field can’t be changed from the list.' }))(req, res, next);
}, async (req, res, next) => {
  try {
    const r = RESOURCES[req.params.resource];
    const patch = req.body;
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' });
    const Model = r.model();
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found.' });
    const problem = r.check ? r.check(doc, patch) : null;
    if (problem) return res.status(400).json({ error: problem });
    const updated = await Model.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.RESOURCES = RESOURCES;
