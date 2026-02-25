import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem("admin")) || null);
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Use API_URL which already includes /api
      const res = await axios.post(`${API_URL}/admin/login`, { email, password });
      setAdmin(res.data.admin);
      setToken(res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      localStorage.setItem("admin_token", res.data.token);
      setLoading(false);
      return true;
    } catch (e) {
      setAdmin(null);
      setToken("");
      localStorage.removeItem("admin");
      localStorage.removeItem("admin_token");
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken("");
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_token");
  };

  return (
    <AdminAuthContext.Provider value={{
      admin,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!admin && !!token
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};