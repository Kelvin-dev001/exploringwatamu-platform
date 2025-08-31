import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function EditCarHire() {
  const { id } = useParams();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicle: "", dailyRate: "", description: "", active: true });
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
    axios.get(process.env.REACT_APP_API_URL + `/carhires/${id}`).then(res => {
      const c = res.data;
      setForm({
        vehicle: c.vehicle._id,
        dailyRate: c.dailyRate,
        description: c.description || "",
        active: c.active
      });
    });
  }, [id]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async e => {
    e.preventDefault();
    await axios.put(process.env.REACT_APP_API_URL + `/carhires/${id}`, form, { headers: { Authorization: `Bearer ${token}` } });
    window.alert("Car hire option updated!");
    navigate("/carhires");
  };

  const selectedVehicle = vehicles.find(v => v._id === form.vehicle);

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Edit Car Hire Option</h2>
      <select value={form.vehicle} onChange={e => handleChange("vehicle", e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
      </select>
      {selectedVehicle && selectedVehicle.image && (
        <img src={selectedVehicle.image} alt={selectedVehicle.name} style={{ width: 120, height: 80, objectFit: "cover", marginBottom: 12 }} />
      )}
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