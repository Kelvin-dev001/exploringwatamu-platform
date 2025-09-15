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
    axios.get(process.env.REACT_APP_API_URL + "/vehicles")
      .then(res => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVehicles([]));
    axios.get(process.env.REACT_APP_API_URL + `/transfers/${id}`)
      .then(res => {
        const t = res.data;
        setForm({
          route: t.route || "",
          vehicle: t.vehicle?._id || "",
          price: t.price || "",
          active: t.active,
          description: t.description || ""
        });
      })
      .catch(() => {});
  }, [id]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        process.env.REACT_APP_API_URL + `/transfers/${id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.alert("Transfer updated!");
      navigate("/transfers");
    } catch {
      window.alert("Failed to update transfer.");
    }
    setLoading(false);
  };

  const selectedVehicle = vehicles.find(v => v._id === form.vehicle);

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Edit Transfer Option</h2>
      <select className="select select-bordered w-full mb-3" value={form.route} onChange={e => handleChange("route", e.target.value)} required>
        <option value="">Select route</option>
        {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select className="select select-bordered w-full mb-3" value={form.vehicle} onChange={e => handleChange("vehicle", e.target.value)} required>
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
      </select>
      {selectedVehicle && selectedVehicle.image && (
        <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-32 h-20 object-cover rounded mb-3" />
      )}
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Price" value={form.price} onChange={e => handleChange("price", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} />
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} className="checkbox" />
        <span>Active</span>
      </label>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}