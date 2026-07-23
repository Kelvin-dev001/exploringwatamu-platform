'use strict';

describe('config/env fail-fast', () => {
  const original = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = original;
    jest.resetModules();
  });

  it('throws when JWT_SECRET is missing', () => {
    jest.resetModules();
    delete process.env.JWT_SECRET;
    expect(() => require('../src/config/env')).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_SECRET is the insecure default', () => {
    jest.resetModules();
    process.env.JWT_SECRET = 'your_jwt_secret';
    expect(() => require('../src/config/env')).toThrow(/insecure default|at least 16/);
  });
});
