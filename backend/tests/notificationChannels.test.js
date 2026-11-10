'use strict';

// The "is email / SMS really configured" flag drives the mailer's transport,
// its audit-log status and the delivery hints the admin UI shows. They must
// agree: a host without a user is NOT a working SMTP setup.

const SMTP_KEYS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'AT_USERNAME', 'AT_API_KEY'];

function load(env) {
  const saved = Object.fromEntries(SMTP_KEYS.map((k) => [k, process.env[k]]));
  SMTP_KEYS.forEach((k) => delete process.env[k]);
  Object.assign(process.env, env);
  let mods;
  jest.isolateModules(() => {
    jest.doMock('../src/services/notifications/log', () => ({ record: jest.fn(async () => {}) }));
    mods = {
      config: require('../src/config/env'),
      mailer: require('../src/services/mailer'),
      log: require('../src/services/notifications/log'),
      delivery: require('../src/services/notifications/delivery'),
    };
  });
  SMTP_KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  return mods;
}

describe('notification channel flags', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('logs a host-only SMTP setup as skipped, not sent', async () => {
    const { config, mailer, log } = load({ SMTP_HOST: 'smtp.example.com' });
    expect(config.mail.enabled).toBe(false);

    await mailer.sendMail({ to: 'amina@example.com', subject: 'Your quote', html: '<p>Hi</p>', event: 'trip_quote_sent' });

    expect(log.record).toHaveBeenCalledWith(expect.objectContaining({ channel: 'email', status: 'skipped' }));
  });

  it('reports which channels a notification can reach', () => {
    const off = load({}).delivery;
    expect(off.deliveryFor({ email: 'a@b.co', phone: '+254700000000' })).toEqual({ email: false, sms: false });

    const on = load({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'mailer', AT_USERNAME: 'ew', AT_API_KEY: 'k' }).delivery;
    expect(on.deliveryFor({ email: 'a@b.co', phone: '+254700000000' })).toEqual({ email: true, sms: true });
    expect(on.deliveryFor({ email: 'a@b.co' })).toEqual({ email: true, sms: false });
  });
});
