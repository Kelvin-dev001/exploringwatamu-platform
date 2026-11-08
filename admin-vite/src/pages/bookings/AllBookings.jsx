import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

const TYPES = [
  { value: "", label: "All types" },
  { value: "triprequest", label: "Trip Request" },
  { value: "grouptour", label: "Group Tour" },
  { value: "tour", label: "Tour" },
  { value: "carhire", label: "Car Hire" },
  { value: "service", label: "Service" },
  { value: "propertyviewing", label: "Property Viewing" },
];

const STATUS_BADGE = {
  pending: "badge badge-warning",
  confirmed: "badge badge-success",
  booked: "badge badge-info",
  cancelled: "badge badge-error",
  new: "badge badge-warning",
  quoted: "badge badge-info",
  accepted: "badge badge-success",
  declined: "badge badge-ghost",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

export default function AllBookings() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ type: "", status: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get(API_URL + "/bookings/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data);
    } catch {
      setSummary(null);
    }
  }, [token]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      params.append("page", page);
      params.append("limit", 20);
      const res = await axios.get(API_URL + `/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(Array.isArray(res.data.data) ? res.data.data : []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setRows([]);
      setTotalPages(1);
    }
    setLoading(false);
  }, [filters, page, token]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">All Bookings</h2>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="stat bg-base-100 shadow rounded-lg">
            <div className="stat-title">Total</div>
            <div className="stat-value text-2xl">{summary.total}</div>
          </div>
          {(summary.byType || []).map((t) => (
            <div key={t.type} className="stat bg-base-100 shadow rounded-lg">
              <div className="stat-title text-xs">{t.label}</div>
              <div className="stat-value text-xl">{t.total}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm">Type</label>
          <select
            className="select select-bordered w-44"
            value={filters.type}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, type: e.target.value })); }}
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select
            className="select select-bordered w-40"
            value={filters.status}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })); }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
            <option value="new">New (trip requests)</option>
            <option value="quoted">Quoted</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Type</th><th>Customer</th><th>Contact</th><th>Item</th><th>Date</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">No bookings found.</td></tr>
            ) : (
              rows.map((b) => (
                <tr key={`${b.type}-${b.id}`}>
                  <td className="capitalize">{b.type}</td>
                  <td>{b.customerName || "-"}</td>
                  <td>{b.customerContact || "-"}</td>
                  <td>{b.item || "-"}</td>
                  <td>{fmtDate(b.date)}</td>
                  <td>{b.amount != null ? `KES ${Number(b.amount).toLocaleString()}` : "-"}</td>
                  <td><span className={STATUS_BADGE[b.status] || "badge"}>{b.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filters.type && totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
      {!filters.type && (
        <p className="text-xs text-gray-400 mt-3">Showing the most recent bookings across all types. Filter by a type to page through it.</p>
      )}
    </div>
  );
}
