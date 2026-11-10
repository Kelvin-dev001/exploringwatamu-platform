import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';

const AuthContext = createContext();

const readToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};
const writeToken = (value) => {
  try {
    if (value) localStorage.setItem('token', value);
    else localStorage.removeItem('token');
  } catch {
    /* storage unavailable — the session lasts until the tab closes */
  }
};

// Only these mean the stored token is no good. Anything else — offline, the
// free-tier API still waking up, a 5xx — is temporary: keep the token so the
// traveller stays signed in, and let pages offer "try again".
const isAuthFailure = (err) => [401, 403].includes(err?.response?.status);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(readToken);
  const [loading, setLoading] = useState(() => Boolean(readToken()));
  const [unreachable, setUnreachable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    axios
      .get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!alive) return;
        setUser(res.data);
        setUnreachable(false);
      })
      .catch((err) => {
        if (!alive) return;
        if (isAuthFailure(err)) {
          writeToken(null);
          setToken(null);
          setUser(null);
        } else {
          setUnreachable(true);
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token, attempt]);

  const login = (newToken, newUser) => {
    writeToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setUnreachable(false);
  };

  const logout = () => {
    writeToken(null);
    setToken(null);
    setUser(null);
    setUnreachable(false);
  };

  /** Check the stored session again (after "We couldn't reach the server"). */
  const retry = useCallback(() => {
    setLoading(true);
    setUnreachable(false);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading, unreachable, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
