import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Link } from "react-router-dom";
import '../index.css';
/**
 * Admin Dashboard
 * - Defensive data handling
 * - Error and loading states
 * - Modern UI (Tailwind/daisyUI)
 * - Responsive layout, accessible markup
 * - Secure API calls (JWT)
 * - Dashboard summary cards + recent activity tables
 */

export default function AdminDashboard() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    hotels: 0,
    vehicles: 0,
    transfers: 0,
    properties: 0,
    services: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Defensive: fetch stats
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await axios.get(process.env.REACT_APP_API_URL + "/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats({
          users: res.data.users || 0,
          bookings: res.data.bookings || 0,
          hotels: res.data.hotels || 0,
          vehicles: res.data.vehicles || 0,
          transfers: res.data.transfers || 0,
          properties: res.data.properties || 0,
          services: res.data.services || 0,
        });
      } catch {
        setError("Failed to load dashboard stats.");
      }
      setLoadingStats(false);
    };

    // Defensive: fetch recent bookings
    const fetchRecentBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await axios.get(process.env.REACT_APP_API_URL + "/admin/recent-bookings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentBookings(Array.isArray(res.data) ? res.data : []);
      } catch {
        setRecentBookings([]);
      }
      setLoadingBookings(false);
    };

    fetchStats();
    fetchRecentBookings();
  }, [token]);

  const cards = [
    { label: "Users", value: stats.users, to: "/users", color: "primary" },
    { label: "Bookings", value: stats.bookings, to: "/bookings", color: "secondary" },
    { label: "Hotels", value: stats.hotels, to: "/hotels", color: "accent" },
    { label: "Vehicles", value: stats.vehicles, to: "/vehicles", color: "info" },
    { label: "Transfers", value: stats.transfers, to: "/transfers", color: "success" },
    { label: "Properties", value: stats.properties, to: "/properties", color: "warning" },
    { label: "Services", value: stats.services, to: "/services", color: "error" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Dashboard summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {cards.map(card => (
          <Link to={card.to} key={card.label} className={`card bg-${card.color} text-white shadow-xl hover:scale-105 transition-transform`}>
            <div className="card-body items-center justify-center">
              <h2 className="card-title">{card.label}</h2>
              <div className="text-3xl font-bold">{loadingStats ? <span className="loading loading-spinner" /> : card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity table */}
      <div className="bg-base-100 shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        {
          loadingBookings ? (
            <div className="text-center py-8"><span className="loading loading-spinner loading-lg" /></div>
          ) : recentBookings.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No recent bookings.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map(b => (
                    <tr key={b._id || b.id}>
                      <td>{b.bookingType || "-"}</td>
                      <td>{b.name || b.guestName || b.userName || "-"}</td>
                      <td>{(b.date || b.startDate || b.checkIn || "").substring(0,10)}</td>
                      <td>{b.status || "-"}</td>
                      <td>
                        <Link className="btn btn-xs btn-info" to={`/${b.bookingType?.toLowerCase()}bookings/${b._id}`}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}