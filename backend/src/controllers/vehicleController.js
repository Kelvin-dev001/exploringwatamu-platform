const Vehicle = require('../models/Vehicle');

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create vehicle', details: err.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update vehicle', details: err.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};