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
    // If multer processed a file, use its Cloudinary URL
    const imageUrl = req.file ? req.file.path : (req.body.image || '');
    const vehicle = new Vehicle({
      name: req.body.name,
      capacity: req.body.capacity ? Number(req.body.capacity) : undefined,
      description: req.body.description || '',
      image: imageUrl,
    });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create vehicle', details: err.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      capacity: req.body.capacity ? Number(req.body.capacity) : undefined,
      description: req.body.description || '',
    };
    // If a new image was uploaded via multer, use it
    if (req.file) {
      updateData.image = req.file.path;
    } else if (req.body.existingImage) {
      updateData.image = req.body.existingImage;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
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