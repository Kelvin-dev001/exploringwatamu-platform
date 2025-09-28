import React from "react";
import Navbar from "./Navbar";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const { isAuthenticated, logout, admin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <header className="flex items-center justify-between p-4 shadow bg-white">
        <div className="font-bold text-xl">Admin Portal</div>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{admin?.email}</span>
            <button
              className="btn btn-outline btn-error btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <Navbar />
      <div className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}