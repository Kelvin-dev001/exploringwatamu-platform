import axios from 'axios';
import { API_URL } from '@/api.js';

/*
 * Authenticated API client for the redesigned screens. Adds the admin token
 * and, on a 401, signs the admin out (expired session) via a window event the
 * auth provider listens for.
 */
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && localStorage.getItem('admin_token')) {
      window.dispatchEvent(new Event('ew:admin-session-expired'));
    }
    return Promise.reject(err);
  }
);

/** Human message from an API error (zod issues, { error }, or network). */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const d = err?.response?.data;
  if (d?.issues?.length) return d.issues.map((i) => i.message).join(' · ');
  if (d?.error) return d.error;
  if (err?.code === 'ERR_NETWORK') return 'Can’t reach the server. The API may be waking up — try again in a moment.';
  return fallback;
}
