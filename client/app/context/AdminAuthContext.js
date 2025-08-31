import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();
export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    const res = await axios.post('YOUR_BACKEND_URL/api/admin/login', { email, password });
    setAdmin(res.data.admin);
    setToken(res.data.token);
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
export function useAdminAuth() {
  return useContext(AdminAuthContext);
}