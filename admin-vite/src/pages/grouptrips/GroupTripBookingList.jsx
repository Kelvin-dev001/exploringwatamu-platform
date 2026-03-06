import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

const STATUS_BADGE = {
  pending: "badge badge-warning",
  confirmed: "badge badge-success",
  cancelled: "badge badge-error",
};

export default function GroupTripBookingList() {
  const { tripId } = useParams();
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tripsRes, bookingsRes] = await Promise.all([
          axios.get(API_URL + "/group-trips/admin/all", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(API_URL + `/group-bookings/admin/trip/${tripId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const trips = Array.isArray(tripsRes.data) ? tripsRes.data : [];
        setTrip(trips.find((t) => t._id === tripId) || null);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      } catch (err) {
        setBookings([]);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [tripId]);

  // Summary stats
  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const revenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.amountPaid || 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/grouptrips")}>
          ← Back
        </button>
        <h2 className="text-2xl font-bold">
          Bookings{trip ? ` — ${trip.title}` : ""}
        </h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Total Bookings</div>
          <div className="stat-value text-2xl">{total}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Confirmed</div>
          <div className="stat-value text-2xl text-success">{confirmed}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Pending</div>
          <div className="stat-value text-2xl text-warning">{pending}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Revenue Collected</div>
          <div className="stat-value text-xl">KES {revenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Payment Type</th>
              <th>Amount Paid</th>
              <th>Amount Due</th>
              <th>Status</th>
              <th>M-Pesa Receipt</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-8">Loading...</td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-400">
                  No bookings found for this trip.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.fullName}</td>
                  <td>{b.email}</td>
                  <td>{b.phone}</td>
                  <td className="capitalize">{b.paymentType}</td>
                  <td>KES {(b.amountPaid || 0).toLocaleString()}</td>
                  <td>KES {(b.amountDue || 0).toLocaleString()}</td>
                  <td>
                    <span className={STATUS_BADGE[b.status] || "badge badge-ghost"}>
                      {b.status}
                    </span>
                  </td>
                  <td>{b.mpesaReceiptNumber || "-"}</td>
                  <td>
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
