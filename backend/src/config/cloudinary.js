'use strict';

const cloudinary = require('cloudinary').v2;
const config = require('./env');

// Only configure the SDK when credentials are present. Without them cloudinary@1
// throws the bare string "Must supply api_key" mid-upload, so
// middleware/upload.js checks config.cloudinary.enabled first and answers 503.
if (config.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

module.exports = cloudinary;
