import React, { createContext, useContext, useState } from 'react';

// Create the context
const AdminAuthContext = createContext();

// Custom hook to use the context
export const useAdminAuth = () => useContext(AdminAuthContext);

// Provider component
export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

  // Example login (replace with your actual logic)
  const login = async (username, password) => {
    setLoading(true);
    // Replace with real authentication
    if (username === "admin" && password === "admin123") {
      setAdmin({ username: "admin" });
      setLoading(false);
      return true;
    } else {
      setAdmin(null);
      setLoading(false);
      return false;
    }
  };

  // Example logout
  const logout = () => {
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{
      admin,
      loading,
      login,
      logout,
      isAuthenticated: !!admin
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};