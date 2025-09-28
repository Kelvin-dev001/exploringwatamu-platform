import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  // Persist admin & token in localStorage for session persistence
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem("admin")) || null);
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [loading, setLoading] = useState(false);

  // Login function: POST to backend, save JWT & admin info
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, { email, password });
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

  // Logout function: clear context and localStorage
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