'use strict';

const mongoose = require('mongoose');
const { errorHandler } = require('../src/middleware/errorHandler');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

const req = { method: 'POST', originalUrl: '/api/group-trips' };

describe('errorHandler', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs the real message when a library throws a bare string (cloudinary@1 does)', () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();

    errorHandler('Must supply api_key', req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(log.mock.calls[0].join(' ')).toContain('Must supply api_key');
  });

  it('passes 4xx messages through', () => {
    const res = mockRes();

    errorHandler(Object.assign(new Error('Bad thing'), { status: 400 }), req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad thing' });
  });

  it('answers a malformed id (Mongoose CastError) with 400, not 500', () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    const err = new mongoose.Error.CastError('ObjectId', 'not-an-id', '_id');

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid id' });
    expect(log).not.toHaveBeenCalled();
  });

  it('answers a schema ValidationError with 400 and field issues', () => {
    const res = mockRes();
    const err = new mongoose.Error.ValidationError();
    err.addError('price', new mongoose.Error.ValidatorError({ path: 'price', message: 'Price is required' }));

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Validation failed', issues: [{ path: 'price', message: 'Price is required' }] });
  });

  it('answers a duplicate key with 409', () => {
    const res = mockRes();

    errorHandler(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }), req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
