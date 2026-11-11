// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { api } from '@/lib/api';

// Changing your own password ends every other session; the server hands this
// one a fresh token, which must replace the old one everywhere it is read.

const wrapper = ({ children }) => (
  <AdminAuthProvider initialAdmin={{ id: '1', email: 'owner@test.com' }} initialToken="old-token">{children}</AdminAuthProvider>
);

describe('replaceToken', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('keeps the session signed in with the new token, for the context and the API client', () => {
    localStorage.setItem('admin_token', 'old-token');
    const { result } = renderHook(() => useAdminAuth(), { wrapper });

    act(() => result.current.replaceToken('fresh-token'));

    expect(result.current.token).toBe('fresh-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('admin_token')).toBe('fresh-token');
    const config = api.interceptors.request.handlers[0].fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer fresh-token');
  });
});
