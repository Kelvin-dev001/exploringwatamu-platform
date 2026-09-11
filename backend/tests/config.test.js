'use strict';

describe('config/env fail-fast', () => {
  const original = process.env.JWT_SECRET;
  const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const originalCloudinary = Object.fromEntries(cloudinaryVars.map((name) => [name, process.env[name]]));

  // Empty strings rather than deletes, so a local .env can't fill them back in.
  function setCloudinary(values) {
    for (const name of cloudinaryVars) process.env[name] = values[name] || '';
  }

  afterEach(() => {
    process.env.JWT_SECRET = original;
    for (const name of cloudinaryVars) {
      if (originalCloudinary[name] === undefined) delete process.env[name];
      else process.env[name] = originalCloudinary[name];
    }
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

  it('throws when Cloudinary is only partially configured', () => {
    jest.resetModules();
    setCloudinary({ CLOUDINARY_CLOUD_NAME: 'demo' });
    expect(() => require('../src/config/env')).toThrow(
      /Cloudinary is partially configured\. Missing: CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET/
    );
  });

  it('boots with image uploads disabled when no Cloudinary vars are set', () => {
    jest.resetModules();
    setCloudinary({});
    expect(require('../src/config/env').cloudinary.enabled).toBe(false);
  });

  it('enables image uploads when all Cloudinary vars are set', () => {
    jest.resetModules();
    setCloudinary({ CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret' });
    expect(require('../src/config/env').cloudinary.enabled).toBe(true);
  });
});
