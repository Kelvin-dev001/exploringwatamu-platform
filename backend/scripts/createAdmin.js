const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createAdmin(email, password) {
  await mongoose.connect('mongodb+srv://watamuser:MmwVQaXF8tvUQr7H@clustersnaap.060sgnk.mongodb.net/?retryWrites=true&w=majority&appName=Clustersnaap'); // replace with your actual MongoDB URL
  const admin = new Admin({ email });
  await admin.setPassword(password);
  await admin.save();
  console.log('Admin created:', email);
  mongoose.disconnect();
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.log('Usage: node createAdmin.js <email> <password>');
  process.exit(1);
}
createAdmin(email, password);