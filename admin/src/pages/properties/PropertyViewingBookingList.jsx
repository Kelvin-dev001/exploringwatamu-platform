import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function ServiceBookingList() {
  const { token } = useAdminAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ serviceId: "", status: "", dateFrom: "", dateTo: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/services").then(res => setServices(res.data.data || res.data));
  }, []);

  const fetchBookings = async () => {
    const params = new URLSearchParams({ ...filters, page, limit: 10 });
    const res = await axios.get(process.env.REACT_APP_API_URL + `/servicebookings?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setBookings(res.data.data || []);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => { fetchBookings(); }, [filters, page]);

  const handleCancel = async id => {
    if (!window.confirm("Cancel this booking?")) return;
    await axios.put(process.env.REACT_APP_API_URL + `/servicebookings/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchBookings();
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Service Bookings</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Service: </label>
        <select value={filters.serviceId} onChange={e => setFilters(f => ({ ...f, serviceId: e.target.value }))}>
          <option value="">All</option>
          {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <label style={{ marginLeft: 8 }}>Status:</label>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label style={{ marginLeft: 8 }}>Date From:</label>
        <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
        <label style={{ marginLeft: 8 }}>Date To:</label>
        <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
        <button style={{ marginLeft: 8 }} onClick={fetchBookings}>Filter</button>
      </div>
      <table style={{ width: "100%", marginBottom: 16 }}>
        <thead>
          <tr>
            <th>Service</th>
            <th>User</th>
            <th>Date</th>
            <th>Time</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b._id}>
              <td>{b.service?.name}</td>
              <td>{b.userName || "-"}<br />{b.userContact || "-"}</td>
              <td>{b.date?.substring(0, 10)}</td>
              <td>{b.time}</td>
              <td>{b.duration}</td>
              <td>{b.status}</td>
              <td>
                {b.status === "booked" &&
                  <button style={{ color: "red" }} onClick={() => handleCancel(b._id)}>Cancel</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span style={{ margin: "0 12px" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}