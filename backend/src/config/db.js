'use strict';

const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../services/logger');

// Cache the connection so repeated calls (and serverless invocations) reuse it
// instead of opening a new connection each time.
let connection = null;

async function connectDB() {
  if (connection) return connection;
  mongoose.set('strictQuery', true);
  try {
    connection = await mongoose.connect(config.mongoUri);
    logger.info('database connected');
    mongoose.connection.on('disconnected', () => logger.warn('database disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('database reconnected'));
    return connection;
  } catch (err) {
    logger.error('database connection failed', logger.errorFields(err));
    throw err;
  }
}

module.exports = connectDB;
