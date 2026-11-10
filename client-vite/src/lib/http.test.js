import { describe, expect, it, vi } from 'vitest';
import { RETRY_DELAYS_MS, installRetry, isNotFound, shouldRetry } from '@/lib/http';

const err = ({ method = 'get', status, code } = {}) => ({ config: { method, url: '/tours' }, code, response: status ? { status } : undefined });

describe('shouldRetry', () => {
  it('retries GETs that got no response or a gateway error (the API waking up)', () => {
    expect(shouldRetry(err({ code: 'ERR_NETWORK' }), 0)).toBe(true);
    expect(shouldRetry(err({ status: 502 }), 0)).toBe(true);
    expect(shouldRetry(err({ status: 503 }), 1)).toBe(true);
    expect(shouldRetry(err({ status: 504 }), 0)).toBe(true);
  });

  it('never retries writes, so a quote request cannot be sent twice', () => {
    expect(shouldRetry(err({ method: 'post', code: 'ERR_NETWORK' }), 0)).toBe(false);
    expect(shouldRetry(err({ method: 'put', status: 503 }), 0)).toBe(false);
  });

  it('does not retry real answers, cancellations, or past the limit', () => {
    expect(shouldRetry(err({ status: 404 }), 0)).toBe(false);
    expect(shouldRetry(err({ status: 401 }), 0)).toBe(false);
    expect(shouldRetry(err({ status: 500 }), 0)).toBe(false);
    expect(shouldRetry(err({ code: 'ERR_CANCELED' }), 0)).toBe(false);
    expect(shouldRetry(err({ status: 503 }), RETRY_DELAYS_MS.length)).toBe(false);
    expect(shouldRetry({}, 0)).toBe(false);
  });
});

describe('installRetry', () => {
  // A stand-in for an axios instance: calling it "sends" the next outcome, and
  // every failure passes through the response interceptor, as in axios.
  function fakeAxios(outcomes) {
    const instance = vi.fn(async (config) => {
      const next = outcomes.shift();
      if (next.ok) return { data: next.data, config };
      return instance.onError({ ...next.error, config });
    });
    instance.interceptors = { response: { use: (_ok, fail) => { instance.onError = fail; } } };
    return instance;
  }
  const firstFailure = (extra) => ({ config: { method: 'get', url: '/tours' }, ...extra });

  it('retries with the configured pauses, then gives up with the last error', async () => {
    const instance = fakeAxios([{ error: { response: { status: 503 } } }, { error: { response: { status: 503 } } }]);
    const wait = vi.fn(async () => {});
    installRetry(instance, { wait });

    await expect(instance.onError(firstFailure({ response: { status: 503 } }))).rejects.toMatchObject({ response: { status: 503 } });
    expect(wait.mock.calls.map((c) => c[0])).toEqual(RETRY_DELAYS_MS);
    expect(instance).toHaveBeenCalledTimes(RETRY_DELAYS_MS.length);
  });

  it('returns the retried response once the API answers', async () => {
    const instance = fakeAxios([{ ok: true, data: ['tour'] }]);
    const wait = vi.fn(async () => {});
    installRetry(instance, { wait });

    const res = await instance.onError(firstFailure({ code: 'ERR_NETWORK' }));

    expect(res.data).toEqual(['tour']);
    expect(wait).toHaveBeenCalledTimes(1);
  });

  it('passes a failed POST straight through', async () => {
    const instance = fakeAxios([]);
    installRetry(instance, { wait: vi.fn() });
    const failure = { config: { method: 'post', url: '/trip-requests' }, code: 'ERR_NETWORK' };
    await expect(instance.onError(failure)).rejects.toBe(failure);
    expect(instance).not.toHaveBeenCalled();
  });
});

describe('isNotFound', () => {
  it('is true only for a real 404', () => {
    expect(isNotFound({ response: { status: 404 } })).toBe(true);
    expect(isNotFound({ code: 'ERR_NETWORK' })).toBe(false);
    expect(isNotFound({ response: { status: 503 } })).toBe(false);
  });
});
