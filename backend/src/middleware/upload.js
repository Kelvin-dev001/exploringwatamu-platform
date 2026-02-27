const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on the route
    let folder = 'general';
    if (req.baseUrl.includes('hotels')) folder = 'hotels';
    else if (req.baseUrl.includes('vehicles')) folder = 'vehicles';
    else if (req.baseUrl.includes('tours')) folder = 'tours';
    else if (req.baseUrl.includes('services')) folder = 'services';
    else if (req.baseUrl.includes('properties')) folder = 'properties';
    else if (req.baseUrl.includes('carhire')) folder = 'carhire';
    else if (req.baseUrl.includes('transfers')) folder = 'transfers';

    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;