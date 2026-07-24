import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

const STATUS_BADGE = {
  sent: "badge badge-success",
  failed: "badge badge-error",
  skipped: "badge badge-ghost",
};

const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

export default function NotificationsLog() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ channel: "", status: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.channel) params.append("channel", filters.channel);
      if (filters.status) params.append("status", filters.status);
      params.append("page", page);
      params.append("limit", 25);
      const res = await axios.get(API_URL + `/notifications?${params}`, {
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

  useEffect(() => { fetchRows(); }, [fetchRows]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      <p className="text-sm text-gray-500 mb-4">A log of every email and SMS the platform has sent.</p>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm">Channel</label>
          <select
            className="select select-bordered w-36"
            value={filters.channel}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, channel: e.target.value })); }}
          >
            <option value="">All</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select
            className="select select-bordered w-36"
            value={filters.status}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })); }}
          >
            <option value="">All</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr><th>Time</th><th>Channel</th><th>Event</th><th>To</th><th>Subject</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">No notifications yet.</td></tr>
            ) : (
              rows.map((n) => (
                <tr key={n._id}>
                  <td className="whitespace-nowrap text-xs">{fmt(n.createdAt)}</td>
                  <td className="uppercase text-xs">{n.channel}</td>
                  <td className="text-xs">{n.event || "-"}</td>
                  <td className="text-xs">{n.to}</td>
                  <td className="text-xs max-w-xs truncate" title={n.subject}>{n.subject || "-"}</td>
                  <td>
                    <span className={STATUS_BADGE[n.status] || "badge"}>{n.status}</span>
                    {n.error ? <span className="text-error text-xs block" title={n.error}>{n.error.slice(0, 40)}</span> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
