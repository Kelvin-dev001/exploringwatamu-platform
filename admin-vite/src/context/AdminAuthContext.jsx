import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

export const AdminAuthProvider = ({ children, initialAdmin, initialToken }) => {
  // initialAdmin/initialToken let previews and tests start signed in.
  const [admin, setAdmin] = useState(() => {
    if (initialAdmin) return initialAdmin;
    try {
      return JSON.parse(read('admin')) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => initialToken || read('admin_token') || '');
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  const clear = () => {
    setAdmin(null);
    setToken('');
    localStorage.removeItem('admin');
    localStorage.removeItem('admin_token');
  };

  /** Returns { ok: true } or { ok: false, error } with a human message. */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { email, password });
      setAdmin(res.data.admin);
      setToken(res.data.token);
      localStorage.setItem('admin', JSON.stringify(res.data.admin));
      localStorage.setItem('admin_token', res.data.token);
      setExpired(false);
      return { ok: true };
    } catch (e) {
      clear();
      const status = e?.response?.status;
      return {
        ok: false,
        error:
          status === 401 ? 'That email and password don’t match an admin account.'
          : status === 429 ? 'Too many attempts. Wait a few minutes and try again.'
          : e?.code === 'ERR_NETWORK' ? 'Can’t reach the server. It may be waking up — try again in 30 seconds.'
          : e?.response?.data?.error || 'Sign-in failed. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => clear();

  // Any 401 from the API client means the session expired: sign out cleanly.
  useEffect(() => {
    const onExpired = () => {
      clear();
      setExpired(true);
    };
    window.addEventListener('ew:admin-session-expired', onExpired);
    return () => window.removeEventListener('ew:admin-session-expired', onExpired);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, setAdmin, token, loading, login, logout, expired, isAuthenticated: !!admin && !!token }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
