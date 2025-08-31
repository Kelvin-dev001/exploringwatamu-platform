import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

const ROUTES = [
  "SGR-Watamu",
  "Moi International Airport-Watamu",
  "Malindi-Watamu",
  "Mombasa-Watamu",
  "Diani-Watamu"
];

export default function NewTransfer() {
  const [form, setForm] = useState({
    route: "",
    vehicle: "",
    price: "",
    active: true,
    description: ""
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(
      process.env.REACT_APP_API_URL + "/transfers",
      form,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    window.alert("Transfer option created!");
    navigate("/transfers");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Add Transfer Option</h2>
      <select value={form.route} onChange={e => handleChange("route", e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select route</option>
        {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={form.vehicle} onChange={e => handleChange("vehicle", e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
      </select>
      <input type="number" placeholder="Price" value={form.price} onChange={e => handleChange("price", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <label>
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} />
        Active
      </label>
      <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}