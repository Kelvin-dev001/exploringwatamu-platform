import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function TourList() {
  const [tours, setTours] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ name: "", active: "", vehicleId: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles")
      .then(res => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVehicles([]));
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page,
        limit: 10
      });
      const res = await axios.get(process.env.REACT_APP_API_URL + `/tours?${params}`);
      // Defensive: always treat as array
      setTours(Array.isArray(res.data.data) ? res.data.data : []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setTours([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTours();
    // eslint-disable-next-line
  }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

  const handleDelete = async id => {
    if (!window.confirm("Delete tour?")) return;
    try {
      await axios.delete(process.env.REACT_APP_API_URL + `/tours/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTours();
    } catch (err) {
      window.alert("Failed to delete tour.");
    }
  };

  return (
    <div className="p-8">
      <button className="btn btn-primary mb-4" onClick={() => navigate("/tours/new")}>Add Tour</button>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm">Tour Name:</label>
          <input className="input input-bordered w-32" type="text" value={filters.name} onChange={e => handleFilterChange("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Active:</label>
          <select className="select select-bordered w-24" value={filters.active} onChange={e => handleFilterChange("active", e.target.value)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Vehicle:</label>
          <select className="select select-bordered w-32" value={filters.vehicleId} onChange={e => handleFilterChange("vehicleId", e.target.value)}>
            <option value="">All</option>
            {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </div>
        <button className="btn btn-outline" onClick={fetchTours}>Filter</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full mt-4">
          <thead>
            <tr>
              <th>Name</th>
              <th>Recommended Times</th>
              <th>Duration</th>
              <th>Vehicles</th>
              <th>Resident Price</th>
              <th>Foreigner Price</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">Loading...</td>
              </tr>
            ) : (
              tours.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.recommendedTimes || '-'}</td>
                  <td>{t.duration || '-'}</td>
                  <td>{Array.isArray(t.vehicles) ? t.vehicles.map(v => v.name).join(', ') : '-'}</td>
                  <td>
                    ${t.priceResidentAdult}/{t.priceResidentChild}
                  </td>
                  <td>
                    ${t.priceForeignerAdult}/{t.priceForeignerChild}
                  </td>
                  <td>{t.active ? "Yes" : "No"}</td>
                  <td>
                    <button className="btn btn-xs btn-info" onClick={() => navigate(`/tours/${t._id}`)}>Edit</button>
                    <button className="btn btn-xs btn-error ml-2" onClick={() => handleDelete(t._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center mt-4 gap-4">
        <button className="btn btn-outline btn-xs" disabled={page <= 1} onClick={() => setPage(prev => prev - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-outline btn-xs" disabled={page >= totalPages} onClick={() => setPage(prev => prev + 1)}>Next</button>
      </div>
    </div>
  );
}