import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function HotelBookingList() {
  const { token } = useAdminAuth();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({ hotelId: "", status: "", dateFrom: "", dateTo: "", guestName: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/hotels")
      .then(res => setHotels(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHotels([]));
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page,
        limit: 10
      });
      const res = await axios.get(process.env.REACT_APP_API_URL + `/hotelbookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(Array.isArray(res.data.data) ? res.data.data : []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setBookings([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

  const handleCancel = async id => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await axios.put(process.env.REACT_APP_API_URL + `/hotelbookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch {
      window.alert("Failed to cancel booking.");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Hotel Bookings</h2>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm">Hotel:</label>
          <select className="select select-bordered w-32" value={filters.hotelId} onChange={e => handleFilterChange("hotelId", e.target.value)}>
            <option value="">All</option>
            {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Status:</label>
          <select className="select select-bordered w-28" value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
            <option value="">All</option>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Date From:</label>
          <input type="date" className="input input-bordered w-32" value={filters.dateFrom} onChange={e => handleFilterChange("dateFrom", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Date To:</label>
          <input type="date" className="input input-bordered w-32" value={filters.dateTo} onChange={e => handleFilterChange("dateTo", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Guest Name:</label>
          <input type="text" className="input input-bordered w-32" value={filters.guestName} onChange={e => handleFilterChange("guestName", e.target.value)} />
        </div>
        <button className="btn btn-outline" onClick={fetchBookings}>Filter</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full mb-4">
          <thead>
            <tr>
              <th>Hotel</th>
              <th>Guest</th>
              <th>Contact</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Rooms</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">Loading...</td>
              </tr>
            ) : (
              bookings.map(b => (
                <tr key={b._id}>
                  <td>{b.hotel?.name}</td>
                  <td>{b.guestName || "-"}</td>
                  <td>{b.guestContact || "-"}</td>
                  <td>{b.checkIn?.substring(0, 10)}</td>
                  <td>{b.checkOut?.substring(0, 10)}</td>
                  <td>{b.roomType || "-"}</td>
                  <td>{b.status}</td>
                  <td>
                    {b.status === "booked" &&
                      <button className="btn btn-xs btn-error" onClick={() => handleCancel(b._id)}>Cancel</button>
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button className="btn btn-outline btn-xs" disabled={page <= 1} onClick={() => setPage(prev => prev - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-outline btn-xs" disabled={page >= totalPages} onClick={() => setPage(prev => prev + 1)}>Next</button>
      </div>
    </div>
  );
}