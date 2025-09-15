import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({ type: "", name: "", location: "", active: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, page, limit: 10 });
      const res = await axios.get(process.env.REACT_APP_API_URL + `/properties?${params}`);
      setProperties(Array.isArray(res.data.data) ? res.data.data : []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setProperties([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, [filters, page]);

  const handleDelete = async id => {
    if (!window.confirm("Delete property?")) return;
    try {
      await axios.delete(process.env.REACT_APP_API_URL + `/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchProperties();
    } catch {
      window.alert("Failed to delete property.");
    }
  };

  return (
    <div className="p-8">
      <button className="btn btn-primary mb-4" onClick={() => navigate("/properties/new")}>Add Property</button>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <select className="select select-bordered w-32" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">All Types</option>
          <option value="villa">Villa</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
        </select>
        <input className="input input-bordered w-32" placeholder="Name" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} />
        <input className="input input-bordered w-32" placeholder="Location" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} />
        <select className="select select-bordered w-24" value={filters.active} onChange={e => setFilters(f => ({ ...f, active: e.target.value }))}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="btn btn-outline" onClick={fetchProperties}>Filter</button>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Location</th>
              <th>Price</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">Loading...</td>
              </tr>
            ) : (
              properties.map(p => (
                <tr key={p._id}>
                  <td>{p.type}</td>
                  <td>{p.name}</td>
                  <td>{p.location}</td>
                  <td>${p.price}</td>
                  <td>{p.active ? "Yes" : "No"}</td>
                  <td>
                    <button className="btn btn-xs btn-info" onClick={() => navigate(`/properties/${p._id}`)}>Edit</button>
                    <button className="btn btn-xs btn-error ml-2" onClick={() => handleDelete(p._id)}>Delete</button>
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