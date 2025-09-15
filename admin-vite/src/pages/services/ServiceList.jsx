import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ name: "", pricingType: "", active: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, page, limit: 10 });
      const res = await axios.get(process.env.REACT_APP_API_URL + `/services?${params}`);
      setServices(Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setServices([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, [filters, page]);

  const handleDelete = async id => {
    if (!window.confirm("Delete service?")) return;
    try {
      await axios.delete(process.env.REACT_APP_API_URL + `/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchServices();
    } catch {
      window.alert("Failed to delete service.");
    }
  };

  return (
    <div className="p-8">
      <button className="btn btn-primary mb-4" onClick={() => navigate("/services/new")}>Add Service</button>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <input className="input input-bordered w-32" placeholder="Name" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} />
        <select className="select select-bordered w-32" value={filters.pricingType} onChange={e => setFilters(f => ({ ...f, pricingType: e.target.value }))}>
          <option value="">All Pricing</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
        </select>
        <select className="select select-bordered w-24" value={filters.active} onChange={e => setFilters(f => ({ ...f, active: e.target.value }))}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="btn btn-outline" onClick={fetchServices}>Filter</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Pricing Type</th>
              <th>Price</th>
              <th>Available Days</th>
              <th>Available Hours</th>
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
              services.map(s => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.description}</td>
                  <td>{s.pricingType}</td>
                  <td>${s.price}</td>
                  <td>{Array.isArray(s.availableDays) ? s.availableDays.join(", ") : "-"}</td>
                  <td>{s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "-"}</td>
                  <td>{s.active ? "Yes" : "No"}</td>
                  <td>
                    <button className="btn btn-xs btn-info" onClick={() => navigate(`/services/${s._id}`)}>Edit</button>
                    <button className="btn btn-xs btn-error ml-2" onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-center mt-4 gap-4">
        <button className="btn btn-outline btn-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-outline btn-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}