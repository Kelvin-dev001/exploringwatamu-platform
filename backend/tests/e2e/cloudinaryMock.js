'use strict';

// Stand-in for multer-storage-cloudinary (no network, no credentials): consumes
// the uploaded file and answers with a predictable URL built from its folder
// and file name. Use with:
//   jest.mock('multer-storage-cloudinary', () => require('./cloudinaryMock'));
class MockCloudinaryStorage {
  constructor({ params }) {
    this.params = params;
  }

  async _handleFile(req, file, cb) {
    const params = await this.params(req, file);
    file.stream.on('end', () => cb(null, { path: `https://res.cloudinary.test/${params.folder}/${file.originalname}`, filename: file.originalname }));
    file.stream.resume();
  }

  _removeFile(req, file, cb) {
    cb(null);
  }
}

module.exports = { CloudinaryStorage: MockCloudinaryStorage };
