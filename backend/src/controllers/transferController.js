const Transfer = require('../models/Transfer');
const { activeFilter, canSee } = require('../services/listingVisibility');
const { contains, pageParams, pageOf } = require('../services/listQuery');

exports.getTransfers = async (req, res, next) => {
  try {
    const { search, route, vehicleId } = req.query;
    const paging = pageParams(req.query);
    const query = activeFilter(req);

    const match = contains(search);
    if (match) query.$or = [{ route: match }, { description: match }];
    if (route) query.route = route;
    if (vehicleId) query.vehicle = vehicleId;

    const [transfers, total] = await Promise.all([
      Transfer.find(query).populate('vehicle').skip(paging.skip).limit(paging.limit),
      Transfer.countDocuments(query),
    ]);
    res.json(pageOf(transfers, total, paging));
  } catch (err) {
    next(err);
  }
};

exports.getTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id).populate('vehicle');
    if (!transfer || !canSee(req, transfer)) return res.status(404).json({ error: 'Not found' });
    res.json(transfer);
  } catch (err) {
    next(err);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const transfer = new Transfer(req.body);
    await transfer.save();
    res.status(201).json(await transfer.populate('vehicle'));
  } catch (err) {
    res.status(400).json({ error: 'Failed to create transfer', details: err.message });
  }
};

exports.updateTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('vehicle');
    if (!transfer) return res.status(404).json({ error: 'Not found' });
    res.json(transfer);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update transfer', details: err.message });
  }
};

exports.deleteTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findByIdAndDelete(req.params.id);
    if (!transfer) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Transfer deleted" });
  } catch (err) {
    next(err);
  }
};