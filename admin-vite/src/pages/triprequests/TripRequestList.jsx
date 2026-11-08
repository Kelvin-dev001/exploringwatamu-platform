import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";
import { STATUSES, statusBadge, kes, fmtDate, itemCount } from "./shared";

/** Custom itineraries sent from the website's trip planner, waiting to be priced. */
export default function TripRequestList() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState("new");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append("status", status);
      if (q.trim()) params.append("q", q.trim());
      const res = await axios.get(`${API_URL}/trip-requests?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setRows(res.data.data || []);
      setCounts(res.data.counts || {});
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load trip requests.");
      setRows([]);
    }
    setLoading(false);
  }, [token, status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Trip requests</h1>
          <p className="text-sm opacity-70">Itineraries built on the website. Price them and the traveller gets the quote by email.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load();
          }}
          className="flex gap-2"
        >
          <input className="input input-bordered input-sm w-64" placeholder="Search reference, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-sm">Search</button>
        </form>
      </div>

      <div role="tablist" className="tabs tabs-boxed mb-4 w-fit">
        <button role="tab" className={`tab ${status === "" ? "tab-active" : ""}`} onClick={() => { setStatus(""); setPage(1); }}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s.value} role="tab" className={`tab ${status === s.value ? "tab-active" : ""}`} onClick={() => { setStatus(s.value); setPage(1); }}>
            {s.label}
            {counts[s.value] ? <span className="badge badge-sm ml-2">{counts[s.value]}</span> : null}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="overflow-x-auto rounded-lg bg-base-100 shadow">
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Traveller</th>
              <th>Dates</th>
              <th>Group</th>
              <th>Items</th>
              <th>Quote</th>
              <th>Status</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-10 text-center"><span className="loading loading-spinner" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center opacity-60">No trip requests here.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="hover">
                  <td><Link className="link link-primary font-mono" to={`/trip-requests/${r._id}`}>{r.reference}</Link></td>
                  <td>
                    <div className="font-semibold">{r.contact?.name}</div>
                    <div className="text-xs opacity-60">{r.contact?.email}</div>
                  </td>
                  <td>{r.arrival ? `${fmtDate(r.arrival)} – ${fmtDate(r.departure)}` : <span className="opacity-60">{(r.days || []).length} days, flexible</span>}</td>
                  <td>{r.adults}A{r.children ? ` ${r.children}C` : ""}</td>
                  <td>{itemCount(r)}</td>
                  <td>{r.quote?.total != null ? kes(r.quote.total) : <span className="opacity-60">-</span>}</td>
                  <td><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="text-sm">{fmtDate(r.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="join mt-4">
          <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>«</button>
          <span className="join-item btn btn-sm btn-disabled">Page {page} of {totalPages}</span>
          <button className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>»</button>
        </div>
      )}
    </div>
  );
}
