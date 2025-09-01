import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ name: "", pricingType: "", active: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const fetchServices = async () => {
    const params = new URLSearchParams({
      ...filters,
      page,
      limit: 10
    });
    const res = await axios.get(process.env.REACT_APP_API_URL + `/services?${params}`);
    setServices(res.data.data);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => { fetchServices(); }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters({ ...filters, [field]: value });

  const handleDelete = async id => {
    if (!window.confirm("Delete service?")) return;
    await axios.delete(process.env.REACT_APP_API_URL + `/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchServices();
  };

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate("/services/new")}>Add Service</button>
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Service Name" value={filters.name} onChange={e => handleFilterChange("name", e.target.value)} style={{ width: 120 }} />
        <select value={filters.pricingType} onChange={e => handleFilterChange("pricingType", e.target.value)} style={{ width: 120 }}>
          <option value="">All Pricing Types</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
        </select>
        <select value={filters.active} onChange={e => handleFilterChange("active", e.target.value)} style={{ width: 120 }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button style={{ marginLeft: 8 }} onClick={fetchServices}>Filter</button>
      </div>
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Pricing</th>
            <th>Available Days</th>
            <th>Available Hours</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map(s => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.pricingType}</td>
              <td>${s.price} / {s.pricingType}</td>
              <td>{s.availableDays.join(", ")}</td>
              <td>{s.availableHours?.start} - {s.availableHours?.end}</td>
              <td>{s.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => navigate(`/services/${s._id}`)}>Edit</button>
                <button onClick={() => handleDelete(s._id)} style={{ color: "red", marginLeft: 8 }}>Delete</button>
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