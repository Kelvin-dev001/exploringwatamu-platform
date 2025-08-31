const Transfer = require('../models/Transfer');
const Vehicle = require('../models/Vehicle');

exports.getTransfers = async (req, res) => {
  try {
    const { search, route, vehicleId, page = 1, limit = 10 } = req.query;
    const query = { active: true };

    if (search) {
      query.$or = [
        { route: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (route) query.route = route;
    if (vehicleId) query.vehicle = vehicleId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transfers = await Transfer.find(query).populate('vehicle').skip(skip).limit(parseInt(limit));
    const total = await Transfer.countDocuments(query);

    res.json({
      data: transfers,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
};

exports.getTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id).populate('vehicle');
    if (!transfer) return res.status(404).json({ error: 'Not found' });
    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfer' });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const transfer = new Transfer(req.body);
    await transfer.save();
    res.status(201).json(await transfer.populate('vehicle'));
  } catch (err) {
    res.status(400).json({ error: 'Failed to create transfer', details: err.message });
  }
};

exports.updateTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('vehicle');
    if (!transfer) return res.status(404).json({ error: 'Not found' });
    res.json(transfer);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update transfer', details: err.message });
  }
};

exports.deleteTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndDelete(req.params.id);
    if (!transfer) return res.status(404).json({ error: 'Not found' });
    res.json({ message: "Transfer deleted" });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transfer' });
  }
};