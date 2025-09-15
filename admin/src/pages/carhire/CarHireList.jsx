import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function CarHireList() {
  const { token } = useAdminAuth();
  const [carHires, setCarHires] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ vehicleType: "", minPrice: "", maxPrice: "", capacity: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles")
      .then(res => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVehicles([]));
  }, []);

  const fetchCarHires = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page,
        limit: 10
      });
      const res = await axios.get(process.env.REACT_APP_API_URL + `/carhires?${params}`);
      setCarHires(Array.isArray(res.data.data) ? res.data.data : []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setCarHires([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCarHires();
    // eslint-disable-next-line
  }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

  const handleDelete = async id => {
    if (!window.confirm("Delete car hire?")) return;
    try {
      await axios.delete(process.env.REACT_APP_API_URL + `/carhires/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCarHires();
    } catch {
      window.alert("Failed to delete car hire.");
    }
  };

  return (
    <div className="p-8">
      <button className="btn btn-primary mb-4" onClick={() => navigate("/carhires/new")}>Add Car Hire Option</button>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm">Vehicle Type:</label>
          <select className="select select-bordered w-32" value={filters.vehicleType} onChange={e => handleFilterChange("vehicleType", e.target.value)}>
            <option value="">All</option>
            {vehicles.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Min Price:</label>
          <input className="input input-bordered w-20" type="number" value={filters.minPrice} onChange={e => handleFilterChange("minPrice", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Max Price:</label>
          <input className="input input-bordered w-20" type="number" value={filters.maxPrice} onChange={e => handleFilterChange("maxPrice", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Capacity:</label>
          <input className="input input-bordered w-20" type="number" value={filters.capacity} onChange={e => handleFilterChange("capacity", e.target.value)} />
        </div>
        <button className="btn btn-outline" onClick={fetchCarHires}>Filter</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full mt-4">
          <thead>
            <tr>
              <th>Image</th>
              <th>Vehicle</th>
              <th>Daily Rate</th>
              <th>Capacity</th>
              <th>Description</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center">Loading...</td>
              </tr>
            ) : (
              carHires.map(c => (
                <tr key={c._id}>
                  <td>
                    {c.vehicle?.image && <img src={c.vehicle.image} alt={c.vehicle.name} className="w-16 h-10 object-cover rounded" />}
                  </td>
                  <td>{c.vehicle?.name}</td>
                  <td>${c.dailyRate}</td>
                  <td>{c.vehicle?.capacity || "-"}</td>
                  <td>{c.description || "-"}</td>
                  <td>{c.active ? "Yes" : "No"}</td>
                  <td>
                    <button className="btn btn-xs btn-info" onClick={() => navigate(`/carhires/${c._id}`)}>Edit</button>
                    <button className="btn btn-xs btn-error ml-2" onClick={() => handleDelete(c._id)}>Delete</button>
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