'use strict';

const express = require('express');
const { z } = require('zod');
const Admin = require('../models/Admin');
const validate = require('../middleware/validate');
const { signAdminToken } = require('../services/tokens');

const router = express.Router();

const view = (a, me) => ({
  id: a._id,
  email: a.email,
  name: a.name || '',
  role: a.role || 'admin',
  lastLoginAt: a.lastLoginAt || null,
  createdAt: a.createdAt,
  createdBy: a.createdBy || null,
  isYou: String(a._id) === String(me),
});

const password = z.string().min(10, 'Password must be at least 10 characters').max(128);
const createSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  name: z.string().trim().max(80).optional(),
  password,
});
const passwordSchema = z.object({ password });
const nameSchema = z.object({ name: z.string().trim().max(80) });

// GET /api/admin/team
router.get('/', async (req, res, next) => {
  try {
    const admins = await Admin.find().sort({ createdAt: 1 });
    res.json(admins.map((a) => view(a, req.admin.id)));
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/team — add a colleague (full admin)
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { email, name, password: pw } = req.body;
    if (await Admin.exists({ email })) return res.status(409).json({ error: 'An admin with that email already exists.' });
    const admin = new Admin({ email, name, role: 'admin', createdBy: req.admin.email });
    await admin.setPassword(pw);
    await admin.save();
    res.status(201).json(view(admin, req.admin.id));
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/team/:id/password — set a new password (yours or a colleague's).
// Ends that admin's other sessions (tokenVersion). Changing your own returns a
// fresh token so this session carries on.
router.put('/:id/password', validate(passwordSchema), async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    await admin.setPassword(req.body.password);
    await admin.save();
    const isYou = String(admin._id) === String(req.admin.id);
    res.json({ ok: true, ...(isYou ? { token: signAdminToken(admin) } : {}) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/team/:id/name
router.put('/:id/name', validate(nameSchema), async (req, res, next) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    res.json(view(admin, req.admin.id));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/team/:id — never removes the last admin
router.delete('/:id', async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    const lastAdmin = { error: 'You can’t remove the last admin. Add someone else first.' };
    if ((await Admin.countDocuments()) <= 1) return res.status(409).json(lastAdmin);
    await admin.deleteOne();
    // Two admins removing each other at the same moment would both pass the
    // check above: if that just removed the last one, put it back.
    if ((await Admin.countDocuments()) === 0) {
      await Admin.collection.insertOne(admin.toObject({ depopulate: true }));
      return res.status(409).json(lastAdmin);
    }
    res.json({ ok: true, removedYourself: String(admin._id) === String(req.admin.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
