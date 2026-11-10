/*
 * Resilience for the API on Render's free plan, which sleeps when idle and
 * can take 30–60 s to wake. A GET that fails with no response (network,
 * timeout) or a gateway error (502/503/504) is retried a couple of times with
 * a growing pause. Writes are never retried, so a quote request or a booking
 * can't be sent twice.
 */
export const RETRY_DELAYS_MS = [2000, 5000];
const GATEWAY_ERRORS = [502, 503, 504];

export function shouldRetry(error, attempt = 0) {
  const config = error?.config;
  if (!config || attempt >= RETRY_DELAYS_MS.length) return false;
  if (String(config.method || 'get').toLowerCase() !== 'get') return false;
  if (error.code === 'ERR_CANCELED') return false;
  return !error.response || GATEWAY_ERRORS.includes(error.response.status);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Adds the bounded GET retry to an axios instance (the app uses the default one). */
export function installRetry(instance, { wait = sleep } = {}) {
  instance.interceptors.response.use(undefined, async (error) => {
    const attempt = error?.config?.ewRetry || 0;
    if (!shouldRetry(error, attempt)) throw error;
    await wait(RETRY_DELAYS_MS[attempt]);
    return instance({ ...error.config, ewRetry: attempt + 1 });
  });
}

/** True only for a real "not found" — not for a network failure or a sleeping server. */
export const isNotFound = (error) => error?.response?.status === 404;
