const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});

// Helper to set password securely
adminSchema.methods.setPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

// Helper to validate password
adminSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Admin', adminSchema);