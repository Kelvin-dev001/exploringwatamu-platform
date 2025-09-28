import React, { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Link } from "react-router-dom";
import Alert from "../components/Alert";
import Card from "../components/Card";
import Button from "../components/Button";

const CARD_ICONS = {
  Users: "👤",
  Bookings: "📅",
  Hotels: "🏨",
  Vehicles: "🚗",
  Transfers: "🛬",
  Properties: "🏠",
  Services: "🛎️"
};

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

  // --- Fetch Data ---
  useEffect(() => {
    document.title = "Admin Dashboard | Exploring Watamu";

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await axios.get(
          process.env.REACT_APP_API_URL + "/admin/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );
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

    const fetchRecentBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await axios.get(
          process.env.REACT_APP_API_URL + "/admin/recent-bookings",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecentBookings(Array.isArray(res.data) ? res.data : []);
      } catch {
        setRecentBookings([]);
      }
      setLoadingBookings(false);
    };

    fetchStats();
    fetchRecentBookings();
  }, [token]);

  // --- Card Data ---
  const cards = [
    { label: "Users", value: stats.users, to: "/users", color: "primary" },
    { label: "Bookings", value: stats.bookings, to: "/bookings", color: "secondary" },
    { label: "Hotels", value: stats.hotels, to: "/hotels", color: "accent" },
    { label: "Vehicles", value: stats.vehicles, to: "/vehicles", color: "info" },
    { label: "Transfers", value: stats.transfers, to: "/transfers", color: "success" },
    { label: "Properties", value: stats.properties, to: "/properties", color: "warning" },
    { label: "Services", value: stats.services, to: "/services", color: "error" },
  ];

  // --- Status Badge Helper ---
  const getStatusBadge = status => {
    switch (status) {
      case "booked": return "badge-success";
      case "cancelled": return "badge-error";
      case "pending": return "badge-warning";
      default: return "badge-info";
    }
  };

  // --- Loading Skeleton ---
  const LoadingCardSkeleton = () => (
    <div className="card bg-base-200 shadow animate-pulse h-32 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-base-300 mb-2" />
      <div className="h-4 bg-base-300 rounded w-1/2 mb-2" />
      <div className="h-6 bg-base-300 rounded w-1/4" />
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8" aria-label="Admin dashboard main content">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      {error && <Alert type="error">{error}</Alert>}

      {/* Stats Cards */}
      <section className="mb-12" aria-label="Dashboard summary cards">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loadingStats
            ? Array.from({ length: 4 }).map((_, i) => <LoadingCardSkeleton key={i} />)
            : cards.map(card => (
                <Link
                  to={card.to}
                  key={card.label}
                  className="focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-lg"
                  aria-label={`Go to ${card.label} management`}
                >
                  <div
                    className={`card bg-${card.color} shadow-xl text-white hover:scale-105 transition-transform cursor-pointer h-32`}
                  >
                    <div className="card-body items-center justify-center">
                      <span className="text-2xl">{CARD_ICONS[card.label]}</span>
                      <h2 className="card-title text-lg">{card.label}</h2>
                      <div className="text-4xl font-extrabold" aria-live="polite">
                        {card.value}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Recent Bookings Table */}
      <section aria-label="Recent bookings table">
        <Card>
          <h2 className="text-xl font-semibold mb-6">Recent Bookings</h2>
          {loadingBookings ? (
            <div className="text-center py-8" aria-busy="true">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-gray-400 text-center py-8 flex flex-col items-center gap-4">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><path stroke="#24b3b3" strokeWidth="2" d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7" /><path stroke="#24b3b3" strokeWidth="2" d="M16 3v4m-8-4v4m-4 0h16" /></svg>
              <span>No recent bookings.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full" aria-label="Recent bookings">
                <thead className="bg-base-200">
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Name</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map(b => (
                    <tr key={b._id || b.id}>
                      <td>{b.bookingType || "-"}</td>
                      <td>{b.name || b.guestName || b.userName || "-"}</td>
                      <td>{(b.date || b.startDate || b.checkIn || "").substring(0, 10)}</td>
                      <td>
                        <span className={`badge badge-sm ${getStatusBadge(b.status)}`}>
                          {b.status || "-"}
                        </span>
                      </td>
                      <td>
                        <Button
                          color="info"
                          size="xs"
                          aria-label={`View details for ${b.bookingType || "booking"}`}
                          onClick={() =>
                            window.location.href = `/${b.bookingType?.toLowerCase()}bookings/${b._id}`
                          }
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}