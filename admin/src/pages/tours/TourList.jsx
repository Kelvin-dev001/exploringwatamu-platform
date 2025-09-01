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
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  const fetchTours = async () => {
    const params = new URLSearchParams({
      ...filters,
      page,
      limit: 10
    });
    const res = await axios.get(process.env.REACT_APP_API_URL + `/tours?${params}`);
    setTours(res.data.data);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => {
    fetchTours();
    // eslint-disable-next-line
  }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters({ ...filters, [field]: value });

  const handleDelete = async id => {
    if (!window.confirm("Delete tour?")) return;
    await axios.delete(process.env.REACT_APP_API_URL + `/tours/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchTours();
  };

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate("/tours/new")}>Add Tour</button>
      <div style={{ marginBottom: 16 }}>
        <label>Tour Name:</label>
        <input type="text" value={filters.name} onChange={e => handleFilterChange("name", e.target.value)} style={{ width: 120 }} />
        <label style={{ marginLeft: 8 }}>Active:</label>
        <select value={filters.active} onChange={e => handleFilterChange("active", e.target.value)} style={{ width: 80 }}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <label style={{ marginLeft: 8 }}>Vehicle:</label>
        <select value={filters.vehicleId} onChange={e => handleFilterChange("vehicleId", e.target.value)} style={{ width: 120 }}>
          <option value="">All</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
        <button style={{ marginLeft: 8 }} onClick={fetchTours}>Filter</button>
      </div>
      <table style={{ width: "100%", marginTop: 24 }}>
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
          {tours.map(t => (
            <tr key={t._id}>
              <td>{t.name}</td>
              <td>{t.recommendedTimes || '-'}</td>
              <td>{t.duration || '-'}</td>
              <td>{t.vehicles?.map(v => v.name).join(', ') || '-'}</td>
              <td>
                ${t.priceResidentAdult}/{t.priceResidentChild}
              </td>
              <td>
                ${t.priceForeignerAdult}/{t.priceForeignerChild}
              </td>
              <td>{t.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => navigate(`/tours/${t._id}`)}>Edit</button>
                <button onClick={() => handleDelete(t._id)} style={{ color: "red", marginLeft: 8 }}>Delete</button>
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