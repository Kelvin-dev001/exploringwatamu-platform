'use strict';

const mongoose = require('mongoose');
const { errorHandler } = require('../src/middleware/errorHandler');
const monitoring = require('../src/services/monitoring');
const config = require('../src/config/env');

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
    const capture = jest.spyOn(monitoring, 'captureException');
    const res = mockRes();

    errorHandler(Object.assign(new Error('Bad thing'), { status: 400 }), req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad thing' });
    expect(capture).not.toHaveBeenCalled();
  });

  it('answers a 5xx with the request id for support, and reports it with route context', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const capture = jest.spyOn(monitoring, 'captureException').mockImplementation(() => {});
    const res = mockRes();
    const err = new Error('connection reset');
    const withId = { ...req, id: 'req-123', baseUrl: '/api/group-trips', route: { path: '/:id' } };

    errorHandler(err, withId, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toMatchObject({ error: 'Internal server error', requestId: 'req-123' });
    expect(capture).toHaveBeenCalledWith(err, { requestId: 'req-123', method: 'POST', route: '/api/group-trips/:id' });
  });

  it('never puts the message or stack in a 5xx body in production', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(monitoring, 'captureException').mockImplementation(() => {});
    const res = mockRes();
    jest.replaceProperty(config, 'isProd', true);

    errorHandler(new Error('E11 secret internals'), { ...req, id: 'req-9' }, res, () => {});

    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error', requestId: 'req-9' });
  });

  it('reports a bare thrown string as an Error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const capture = jest.spyOn(monitoring, 'captureException').mockImplementation(() => {});

    errorHandler('Must supply api_key', req, mockRes(), () => {});

    expect(capture.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(capture.mock.calls[0][0].message).toBe('Must supply api_key');
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
