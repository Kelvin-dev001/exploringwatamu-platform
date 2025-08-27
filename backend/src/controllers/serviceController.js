const Service = require('../models/Service');

// Get all services
exports.getServices = async (req, res) => {
  const services = await Service.find();
  res.json(services);
};

// Create service
exports.createService = async (req, res) => {
  const service = new Service(req.body);
  await service.save();
  res.status(201).json(service);
};

// Update service
exports.updateService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(service);
};

// Delete service
exports.deleteService = async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ message: "Service deleted" });
};