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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles")
      .then(res => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVehicles([]));
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page,
        limit: 10
      });
      const res = await axios.get(process.env.REACT_APP_API_URL + `/carhirebookings?${params}`, {
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
      await axios.put(process.env.REACT_APP_API_URL + `/carhirebookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch {
      window.alert("Failed to cancel booking.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Car Hire Bookings</h2>
      <div className="card bg-base-100 shadow-md mb-8 p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1">Vehicle</label>
            <select className="select select-bordered w-32" value={filters.vehicleId} onChange={e => handleFilterChange("vehicleId", e.target.value)}>
              <option value="">All</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Status</label>
            <select className="select select-bordered w-28" value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
              <option value="">All</option>
              <option value="booked">Booked</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Start</label>
            <input type="date" className="input input-bordered w-32" value={filters.startDate} onChange={e => handleFilterChange("startDate", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">End</label>
            <input type="date" className="input input-bordered w-32" value={filters.endDate} onChange={e => handleFilterChange("endDate", e.target.value)} />
          </div>
          <button className="btn btn-outline" onClick={fetchBookings}>Filter</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full mb-4">
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
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center">Loading...</td>
              </tr>
            ) : (
              bookings.map(b => (
                <tr key={b._id}>
                  <td>{b.carHire?.vehicle?.name}</td>
                  <td>
                    {b.userName || "-"}ss
                    <br />
                    {b.userContact || "-"}
                  </td>
                  <td>{b.startDate?.substring(0, 10)} to {b.endDate?.substring(0, 10)}</td>
                  <td>
                    <span className={`badge ${b.status === "booked" ? "badge-success" : "badge-error"} badge-sm`}>
                      {b.status}
                    </span>
                  </td>
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