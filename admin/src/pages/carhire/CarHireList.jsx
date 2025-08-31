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
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  const fetchCarHires = async () => {
    const params = new URLSearchParams({
      ...filters,
      page,
      limit: 10
    });
    const res = await axios.get(process.env.REACT_APP_API_URL + `/carhires?${params}`);
    setCarHires(res.data.data);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => {
    fetchCarHires();
    // eslint-disable-next-line
  }, [filters, page]);

  const handleFilterChange = (field, value) => setFilters({ ...filters, [field]: value });

  const handleDelete = async id => {
    if (!window.confirm("Delete car hire?")) return;
    await axios.delete(process.env.REACT_APP_API_URL + `/carhires/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchCarHires();
  };

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate("/carhires/new")}>Add Car Hire Option</button>
      <div style={{ marginBottom: 16 }}>
        <label>Vehicle Type: </label>
        <select value={filters.vehicleType} onChange={e => handleFilterChange("vehicleType", e.target.value)}>
          <option value="">All</option>
          {vehicles.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
        </select>
        <label style={{ marginLeft: 8 }}>Min Price:</label>
        <input type="number" value={filters.minPrice} onChange={e => handleFilterChange("minPrice", e.target.value)} style={{ width: 80 }} />
        <label style={{ marginLeft: 8 }}>Max Price:</label>
        <input type="number" value={filters.maxPrice} onChange={e => handleFilterChange("maxPrice", e.target.value)} style={{ width: 80 }} />
        <label style={{ marginLeft: 8 }}>Capacity:</label>
        <input type="number" value={filters.capacity} onChange={e => handleFilterChange("capacity", e.target.value)} style={{ width: 80 }} />
        <button style={{ marginLeft: 8 }} onClick={fetchCarHires}>Filter</button>
      </div>
      <table style={{ width: "100%", marginTop: 24 }}>
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
          {carHires.map(c => (
            <tr key={c._id}>
              <td>{c.vehicle?.image && <img src={c.vehicle.image} alt={c.vehicle.name} style={{ width: 64, height: 40, objectFit: "cover" }} />}</td>
              <td>{c.vehicle?.name}</td>
              <td>${c.dailyRate}</td>
              <td>{c.vehicle?.capacity || "-"}</td>
              <td>{c.description || "-"}</td>
              <td>{c.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => navigate(`/carhires/${c._id}`)}>Edit</button>
                <button onClick={() => handleDelete(c._id)} style={{ color: "red", marginLeft: 8 }}>Delete</button>
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