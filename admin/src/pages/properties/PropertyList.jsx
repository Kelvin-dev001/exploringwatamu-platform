import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({ type: "", name: "", location: "", active: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchProperties = async () => {
    const params = new URLSearchParams({ ...filters, page, limit: 10 });
    const res = await axios.get(process.env.REACT_APP_API_URL + `/properties?${params}`);
    setProperties(res.data.data);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => { fetchProperties(); }, [filters, page]);

  const handleDelete = async id => {
    if (!window.confirm("Delete property?")) return;
    await axios.delete(process.env.REACT_APP_API_URL + `/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchProperties();
  };

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate("/properties/new")}>Add Property</button>
      <div style={{ marginBottom: 16 }}>
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">All Types</option>
          <option value="villa">Villa</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
        </select>
        <input placeholder="Name" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} style={{ width: 120 }} />
        <input placeholder="Location" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} style={{ width: 120 }} />
        <select value={filters.active} onChange={e => setFilters(f => ({ ...f, active: e.target.value }))}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button style={{ marginLeft: 8 }} onClick={fetchProperties}>Filter</button>
      </div>
      <table style={{ width: "100%" }}>
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
          {properties.map(p => (
            <tr key={p._id}>
              <td>{p.type}</td>
              <td>{p.name}</td>
              <td>{p.location}</td>
              <td>${p.price}</td>
              <td>{p.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => navigate(`/properties/${p._id}`)}>Edit</button>
                <button onClick={() => handleDelete(p._id)} style={{ color: "red", marginLeft: 8 }}>Delete</button>
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