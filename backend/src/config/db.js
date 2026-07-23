'use strict';

const mongoose = require('mongoose');
const config = require('./env');

// Cache the connection so repeated calls (and serverless invocations) reuse it
// instead of opening a new connection each time.
let connection = null;

async function connectDB() {
  if (connection) return connection;
  mongoose.set('strictQuery', true);
  try {
    connection = await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');
    return connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = connectDB;
