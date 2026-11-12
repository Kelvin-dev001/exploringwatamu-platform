// @vitest-environment jsdom
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
// The signed-in account, set per test.
const auth = { user: null, token: null, setUser: vi.fn() };
vi.mock('@/context/AuthContext.jsx', () => ({ useAuth: () => auth }));

const axios = (await import('axios')).default;
const { setLocale } = await import('@/i18n');
const { default: VerifyEmail } = await import('@/pages/VerifyEmail');
const { default: ConfirmEmailNotice } = await import('@/components/auth/ConfirmEmailNotice');

// Confirming the email address (security review S6): the link from the email,
// and the "send me a new link" notice in My bookings.

const unconfirmed = { _id: 'u1', name: 'Ada', email: 'ada@example.com', emailVerified: false };
const signIn = (user) => Object.assign(auth, { user, token: user ? 'tok' : null });
const openLink = (path = '/verify-email?token=abc123') =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <VerifyEmail />
      </MemoryRouter>
    </StrictMode>
  );
// Rejections are created when called, so none is left unhandled.
const failWith = (status) => () => Promise.reject(status ? { response: { status, data: {} } } : new Error('Network Error'));

beforeEach(() => {
  vi.clearAllMocks();
  signIn(null);
  setLocale('en', { persist: false });
});
afterEach(cleanup);

describe('the confirmation link', () => {
  it('confirms once (even when React runs effects twice) and updates the signed-in account', async () => {
    signIn(unconfirmed);
    axios.post.mockResolvedValue({ data: { message: 'Email address confirmed.', email: 'ada@example.com' } });
    openLink();
    expect(screen.getByRole('status').textContent).toContain('Confirming your email address');
    expect(await screen.findByRole('heading', { name: 'Email confirmed' })).toBeTruthy();
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/verify-email$/), { token: 'abc123' });
    // Updated by an effect right after the confirmed screen renders.
    await waitFor(() => expect(auth.setUser).toHaveBeenCalledWith({ ...unconfirmed, emailVerified: true }));
    expect(screen.getByRole('link', { name: 'See my bookings' }).getAttribute('href')).toBe('/my-trips');
  });

  it('works signed out and offers to sign in', async () => {
    axios.post.mockResolvedValue({ data: { email: 'ada@example.com' } });
    openLink();
    expect(await screen.findByText(/is confirmed\. Trip requests you sent/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/login');
    expect(auth.setUser).not.toHaveBeenCalled();
  });

  it('offers a new link when the link has expired', async () => {
    signIn(unconfirmed);
    axios.post.mockImplementationOnce(failWith(400)).mockResolvedValueOnce({ data: { alreadyVerified: false, delivery: { email: true } } });
    openLink();
    expect((await screen.findByRole('alert')).textContent).toBe('This confirmation link is invalid, already used or has expired.');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send a new link' })));
    expect(axios.post).toHaveBeenLastCalledWith(expect.stringMatching(/\/auth\/resend-verification$/), { locale: 'en' }, { headers: { Authorization: 'Bearer tok' } });
    expect(screen.getByRole('status').textContent).toBe('A new link is on its way to ada@example.com. Check your inbox and spam folder.');
  });

  it('asks a signed-out visitor to sign in for a new link', async () => {
    axios.post.mockImplementation(failWith(400));
    openLink();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/login');
    expect(screen.queryByRole('button', { name: 'Send a new link' })).toBeNull();
  });

  it('says so when the address is already confirmed (link clicked twice)', async () => {
    signIn({ ...unconfirmed, emailVerified: true });
    axios.post.mockImplementation(failWith(400));
    openLink();
    expect(await screen.findByText(/is already confirmed/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not call the API without a token, and tells an offline visitor to retry', async () => {
    openLink('/verify-email');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(axios.post).not.toHaveBeenCalled();
    cleanup();

    axios.post.mockImplementation(failWith(null));
    openLink();
    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn’t reach our server/);
  });

  it('speaks Italian on the Italian site and asks for an Italian link', async () => {
    setLocale('it', { persist: false });
    signIn(unconfirmed);
    axios.post.mockImplementationOnce(failWith(400)).mockResolvedValueOnce({ data: { alreadyVerified: false, delivery: { email: true } } });
    openLink();
    expect((await screen.findByRole('alert')).textContent).toBe('Questo link di conferma non è valido, è già stato usato o è scaduto.');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Inviami un nuovo link' })));
    expect(axios.post.mock.lastCall[1]).toEqual({ locale: 'it' });
  });
});

describe('the My bookings notice', () => {
  const notice = () => render(<ConfirmEmailNotice />);

  it('shows only for an account the API says is unconfirmed', () => {
    signIn({ ...unconfirmed, emailVerified: true });
    notice();
    expect(screen.queryByRole('heading', { name: 'Confirm your email address' })).toBeNull();
    cleanup();
    signIn({ ...unconfirmed, emailVerified: undefined }); // an API without the flag
    notice();
    expect(screen.queryByRole('heading', { name: 'Confirm your email address' })).toBeNull();
    cleanup();
    signIn(unconfirmed);
    notice();
    expect(screen.getByRole('heading', { name: 'Confirm your email address' })).toBeTruthy();
    expect(screen.getByText('ada@example.com').tagName).toBe('STRONG');
  });

  it('says when too many links were asked for, or email is unavailable', async () => {
    signIn(unconfirmed);
    axios.post.mockImplementationOnce(failWith(429)).mockResolvedValueOnce({ data: { alreadyVerified: false, delivery: { email: false } } }).mockImplementationOnce(failWith(500));
    notice();
    const resend = () => act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send a new link' })));
    await resend();
    expect(screen.getByRole('alert').textContent).toMatch(/wait an hour/);
    await resend();
    expect(screen.getByRole('alert').textContent).toMatch(/can’t send emails right now/);
    expect(screen.getByRole('link', { name: 'Write to us' }).getAttribute('href')).toBe('mailto:hello@exploringwatamu.com');
    await resend();
    expect(screen.getByRole('alert').textContent).toBe('We couldn’t send a new link. Please try again.');
  });

  it('updates the account when the address was confirmed meanwhile', async () => {
    signIn(unconfirmed);
    axios.post.mockResolvedValue({ data: { alreadyVerified: true } });
    notice();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Send a new link' })));
    expect(auth.setUser).toHaveBeenCalledWith({ ...unconfirmed, emailVerified: true });
  });
});
