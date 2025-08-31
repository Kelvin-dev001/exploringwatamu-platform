import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

export default function NewCarHire() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicle: "", dailyRate: "", description: "", active: true });
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async e => {
    e.preventDefault();
    await axios.post(process.env.REACT_APP_API_URL + "/carhires", form, { headers: { Authorization: `Bearer ${token}` } });
    window.alert("Car hire option created!");
    navigate("/carhires");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Add Car Hire Option</h2>
      <select value={form.vehicle} onChange={e => handleChange("vehicle", e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
      </select>
      <input type="number" placeholder="Daily Rate" value={form.dailyRate} onChange={e => handleChange("dailyRate", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <label>
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} />
        Active
      </label>
      <button type="submit">Save</button>
    </form>
  );
}