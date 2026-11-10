// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
const axios = (await import('axios')).default;
const { AuthProvider, useAuth } = await import('@/context/AuthContext');

// The stored session must only be dropped when the API says it's invalid —
// not when the free-tier API is still waking up or the traveller is offline.

function Probe() {
  const { user, loading, unreachable, retry } = useAuth();
  const state = loading ? 'loading' : user ? `signed in as ${user.name}` : unreachable ? 'unreachable' : 'signed out';
  return (
    <>
      <p data-testid="state">{state}</p>
      <button type="button" onClick={retry}>Try again</button>
    </>
  );
}

const renderAuth = () => render(<AuthProvider><Probe /></AuthProvider>);
const state = () => screen.getByTestId('state').textContent;

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    axios.get.mockReset();
  });

  it('is signed out without asking the API when nothing is stored', () => {
    renderAuth();
    expect(state()).toBe('signed out');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('restores a stored session', async () => {
    localStorage.setItem('token', 't-1');
    axios.get.mockResolvedValue({ data: { name: 'Amina' } });
    renderAuth();
    expect(state()).toBe('loading');
    await waitFor(() => expect(state()).toBe('signed in as Amina'));
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/me$/), { headers: { Authorization: 'Bearer t-1' } });
  });

  it('drops the session when the API rejects the token', async () => {
    localStorage.setItem('token', 'expired');
    axios.get.mockRejectedValue({ response: { status: 401 } });
    renderAuth();
    await waitFor(() => expect(state()).toBe('signed out'));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('keeps the session when the API cannot be reached, and retries on request', async () => {
    localStorage.setItem('token', 't-1');
    axios.get.mockRejectedValueOnce({ code: 'ERR_NETWORK' });
    renderAuth();
    await waitFor(() => expect(state()).toBe('unreachable'));
    expect(localStorage.getItem('token')).toBe('t-1');

    axios.get.mockResolvedValueOnce({ data: { name: 'Amina' } });
    await act(async () => fireEvent.click(screen.getByText('Try again')));
    await waitFor(() => expect(state()).toBe('signed in as Amina'));
  });

  it('treats a server error like an outage, not a sign-out', async () => {
    localStorage.setItem('token', 't-1');
    axios.get.mockRejectedValue({ response: { status: 503 } });
    renderAuth();
    await waitFor(() => expect(state()).toBe('unreachable'));
    expect(localStorage.getItem('token')).toBe('t-1');
  });
});
