import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function TourBookingList() {
  const { token } = useAdminAuth();
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ tourId: "", vehicleId: "", status: "", dateFrom: "", dateTo: "", name: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/tours").then(res => setTours(res.data.data || res.data));
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  const fetchBookings = async () => {
    const params = new URLSearchParams({
      ...filters,
      page,
      limit: 10
    });
    const res = await axios.get(process.env.REACT_APP_API_URL + `/tourbookings?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setBookings(res.data.data || []);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters({ ...filters, [field]: value });

  const handleCancel = async id => {
    if (!window.confirm("Cancel this booking?")) return;
    await axios.put(process.env.REACT_APP_API_URL + `/tourbookings/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchBookings();
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Tour Bookings</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Tour: </label>
        <select value={filters.tourId} onChange={e => handleFilterChange("tourId", e.target.value)}>
          <option value="">All</option>
          {tours.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <label style={{ marginLeft: 8 }}>Vehicle:</label>
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
        <label style={{ marginLeft: 8 }}>Date From:</label>
        <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange("dateFrom", e.target.value)} />
        <label style={{ marginLeft: 8 }}>Date To:</label>
        <input type="date" value={filters.dateTo} onChange={e => handleFilterChange("dateTo", e.target.value)} />
        <label style={{ marginLeft: 8 }}>Tour Name:</label>
        <input type="text" value={filters.name} onChange={e => handleFilterChange("name", e.target.value)} style={{ width: 120 }} />
        <button style={{ marginLeft: 8 }} onClick={fetchBookings}>Filter</button>
      </div>
      <table style={{ width: "100%", marginBottom: 16 }}>
        <thead>
          <tr>
            <th>Tour</th>
            <th>Vehicle</th>
            <th>User</th>
            <th>Date</th>
            <th>Pax</th>
            <th>Residency</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b._id}>
              <td>{b.tour?.name}</td>
              <td>{b.vehicle?.name || "-"}</td>
              <td>{b.userName || "-"}<br />{b.userContact || "-"}</td>
              <td>{b.date?.substring(0, 10)}</td>
              <td>{b.adults} adults, {b.children} children</td>
              <td>{b.isResident ? "Resident" : "Foreigner"}</td>
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