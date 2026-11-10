import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, errorMessage } from '@/lib/api';

describe('errorMessage', () => {
  it('shows validation issues, then the API error, then a network hint', () => {
    expect(errorMessage({ response: { data: { error: 'Validation failed', issues: [{ message: 'Title is required' }, { message: 'Seats must be at least 1' }] } } })).toBe('Title is required · Seats must be at least 1');
    expect(errorMessage({ response: { data: { error: 'This trip is full.' } } })).toBe('This trip is full.');
    expect(errorMessage({ code: 'ERR_NETWORK' })).toMatch(/waking up/);
    expect(errorMessage({}, 'Couldn’t save.')).toBe('Couldn’t save.');
  });
});

describe('admin API client', () => {
  const store = new Map();
  const handlers = () => ({
    request: api.interceptors.request.handlers[0].fulfilled,
    rejected: api.interceptors.response.handlers[0].rejected,
  });

  afterEach(() => {
    store.clear();
    vi.unstubAllGlobals();
  });

  function stubBrowser() {
    vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) });
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    return dispatchEvent;
  }

  it('sends the admin token with every request', () => {
    stubBrowser();
    store.set('admin_token', 'tok');
    const config = handlers().request({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer tok');
  });

  it('signs the admin out on a 401 (expired or removed account), but not otherwise', async () => {
    const dispatchEvent = stubBrowser();
    store.set('admin_token', 'tok');
    await expect(handlers().rejected({ response: { status: 401 } })).rejects.toBeTruthy();
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'ew:admin-session-expired' }));

    dispatchEvent.mockClear();
    await expect(handlers().rejected({ response: { status: 500 } })).rejects.toBeTruthy();
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});
