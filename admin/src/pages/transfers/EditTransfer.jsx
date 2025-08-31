import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

const ROUTES = [
  "SGR-Watamu",
  "Moi International Airport-Watamu",
  "Malindi-Watamu",
  "Mombasa-Watamu",
  "Diani-Watamu"
];

export default function EditTransfer() {
  const { id } = useParams();
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
    axios.get(process.env.REACT_APP_API_URL + `/transfers/${id}`).then(res => {
      const t = res.data;
      setForm({
        route: t.route,
        vehicle: t.vehicle._id,
        price: t.price,
        active: t.active,
        description: t.description || ""
      });
    });
  }, [id]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.put(
      process.env.REACT_APP_API_URL + `/transfers/${id}`,
      form,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    window.alert("Transfer updated!");
    navigate("/transfers");
  };

  const selectedVehicle = vehicles.find(v => v._id === form.vehicle);

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Edit Transfer Option</h2>
      <select value={form.route} onChange={e => handleChange("route", e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select route</option>
        {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={form.vehicle} onChange={e => handleChange("vehicle", e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
      </select>
      {selectedVehicle && selectedVehicle.image && (
        <img src={selectedVehicle.image} alt={selectedVehicle.name} style={{ width: 120, height: 80, objectFit: "cover", marginBottom: 12 }} />
      )}
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