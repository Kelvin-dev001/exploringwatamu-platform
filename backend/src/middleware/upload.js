'use strict';

const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const config = require('../config/env');

// Admin image uploads: multipart parsing (multer) streamed to Cloudinary.
// Upload failures are answered here with a real status and a message the
// admin UI can show, instead of reaching the generic handler as a bare 500:
//   400  too large, unexpected field, too many files, format rejected by Cloudinary
//   502  Cloudinary or network failure
//   503  image hosting not configured on this server

const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

// Phone cameras produce HEIC/HEIF (and some browsers AVIF). Cloudinary accepts
// them, but not every browser can display them, so they are stored as JPG.
const CONVERT_TO_JPG = ['heic', 'heif', 'avif'];
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', ...CONVERT_TO_JPG];

// Cloudinary folder per router, matched in order against the mount path.
const FOLDERS = ['hotels', 'vehicles', 'tours', 'services', 'properties', 'carhire', 'transfers', 'group-trips'];

class UploadError extends Error {
  constructor(status, message, { code, field, cause } = {}) {
    super(message, { cause });
    this.name = 'UploadError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

function needsJpgConversion(file) {
  const subtype = String(file.mimetype || '').split('/')[1] || '';
  const extension = path.extname(file.originalname || '').slice(1);
  return [subtype, extension].some((format) => CONVERT_TO_JPG.includes(format.toLowerCase()));
}

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: FOLDERS.find((folder) => req.baseUrl.includes(folder)) || 'general',
    allowed_formats: ALLOWED_FORMATS,
    ...(needsJpgConversion(file) ? { format: 'jpg' } : {}),
  }),
});

// cloudinary@1 fails with bare strings ("Must supply api_key") or plain objects
// ({ message, http_code }) rather than Error instances.
function toUploadError(err, file) {
  const reason = typeof err === 'string' ? err : (err && err.message) || 'unknown error';
  const context = { field: file.fieldname, cause: err };
  if (err && err.http_code === 400) {
    return new UploadError(400, `Image "${file.originalname}" was rejected: ${reason}`, { code: 'UPLOAD_REJECTED', ...context });
  }
  return new UploadError(502, `Image upload failed: ${reason}`, { code: 'UPLOAD_FAILED', ...context });
}

// Storage engine in front of Cloudinary: refuses uploads while hosting is not
// configured, and normalizes Cloudinary failures into UploadErrors.
const storage = {
  _handleFile(req, file, cb) {
    if (!config.cloudinary.enabled) {
      file.stream.resume();
      return cb(new UploadError(
        503,
        'Image hosting is not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.',
        { code: 'UPLOAD_NOT_CONFIGURED', field: file.fieldname }
      ));
    }
    cloudinaryStorage._handleFile(req, file, (err, info) => (err ? cb(toUploadError(err, file)) : cb(null, info)));
  },
  _removeFile(req, file, cb) {
    cloudinaryStorage._removeFile(req, file, cb);
  },
};

function describeMulterError(err, fields) {
  const expected = fields.find((field) => field.name === err.field);
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return `"${err.field}" is too large: images must be ${MAX_FILE_SIZE_MB} MB or smaller.`;
    case 'LIMIT_UNEXPECTED_FILE':
      return expected
        ? `Too many files for "${err.field}": at most ${expected.maxCount}.`
        : `Unexpected file field "${err.field}". Expected: ${fields.map((field) => field.name).join(', ')}.`;
    case 'LIMIT_FILE_COUNT':
      return `Too many files: at most ${fields.reduce((total, field) => total + field.maxCount, 0)} per request.`;
    default:
      return err.field ? `${err.message} ("${err.field}")` : err.message;
  }
}

// Runs a multer middleware and answers its failures directly.
function handleUploadErrors(middleware, fields) {
  return function upload(req, res, next) {
    middleware(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: describeMulterError(err, fields), code: err.code, field: err.field });
      }
      if (err instanceof UploadError) {
        if (err.status >= 500) console.error(`[upload] ${err.status} ${err.message}`, err.cause || '');
        return res.status(err.status).json({ error: err.message, code: err.code, field: err.field });
      }
      // Anything else was raised parsing the multipart body itself (busboy),
      // e.g. a truncated or malformed request.
      return res.status(400).json({ error: `Malformed upload request: ${(err && err.message) || err}`, code: 'MALFORMED_MULTIPART' });
    });
  };
}

function uploader(fields) {
  const files = fields.reduce((total, field) => total + field.maxCount, 0);
  return multer({ storage, limits: { fileSize: MAX_FILE_SIZE, files } });
}

// Drop-in replacements for multer's .fields() / .array() / .single().
function uploadFields(fields) {
  return handleUploadErrors(uploader(fields).fields(fields), fields);
}

function uploadArray(name, maxCount) {
  const fields = [{ name, maxCount }];
  return handleUploadErrors(uploader(fields).array(name, maxCount), fields);
}

function uploadSingle(name) {
  const fields = [{ name, maxCount: 1 }];
  return handleUploadErrors(uploader(fields).single(name), fields);
}

module.exports = { uploadFields, uploadArray, uploadSingle, UploadError, MAX_FILE_SIZE };
