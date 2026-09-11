'use strict';

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
});
