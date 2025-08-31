const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});

// Set password securely
userSchema.methods.setPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

// Validate password
userSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);