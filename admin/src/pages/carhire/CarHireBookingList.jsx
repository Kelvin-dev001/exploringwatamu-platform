import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function CarHireBookingList() {
  const { token } = useAdminAuth();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ vehicleId: "", status: "", startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  const fetchBookings = async () => {
    const params = new URLSearchParams({
      ...filters,
      page,
      limit: 10
    });
    const res = await axios.get(process.env.REACT_APP_API_URL + `/carhirebookings?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setBookings(res.data.data);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters({ ...filters, [field]: value });

  const handleCancel = async id => {
    if (!window.confirm("Cancel this booking?")) return;
    await axios.put(process.env.REACT_APP_API_URL + `/carhirebookings/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchBookings();
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Car Hire Bookings</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Vehicle: </label>
        <select value={filters.vehicleId} onChange={e => handleFilterChange("vehicleId", e.target.value)}>
          <option value="">All</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
        <label style={{ marginLeft: 8 }}>Status:</label>
        <select value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
          <option value="">All</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label style={{ marginLeft: 8 }}>Start:</label>
        <input type="date" value={filters.startDate} onChange={e => handleFilterChange("startDate", e.target.value)} />
        <label style={{ marginLeft: 8 }}>End:</label>
        <input type="date" value={filters.endDate} onChange={e => handleFilterChange("endDate", e.target.value)} />
        <button style={{ marginLeft: 8 }} onClick={fetchBookings}>Filter</button>
      </div>
      <table style={{ width: "100%", marginBottom: 16 }}>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>User</th>
            <th>Dates</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b._id}>
              <td>{b.carHire?.vehicle?.name}</td>
              <td>{b.userName || "-"}<br />{b.userContact || "-"}</td>
              <td>{b.startDate?.substring(0, 10)} to {b.endDate?.substring(0, 10)}</td>
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