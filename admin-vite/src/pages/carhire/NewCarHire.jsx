import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

export default function NewCarHire() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicle: "", dailyRate: "", description: "", active: true });
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles")
      .then(res => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVehicles([]));
  }, []);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(process.env.REACT_APP_API_URL + "/carhires", form, { headers: { Authorization: `Bearer ${token}` } });
      window.alert("Car hire option created!");
      navigate("/carhires");
    } catch {
      window.alert("Failed to create car hire option.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow-xl rounded">
      <h2 className="text-2xl font-bold mb-6">Add Car Hire Option</h2>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Vehicle</label>
        <select className="select select-bordered w-full" value={form.vehicle} onChange={e => handleChange("vehicle", e.target.value)} required>
          <option value="">Select vehicle</option>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Daily Rate</label>
        <input type="number" className="input input-bordered w-full" placeholder="Daily Rate" value={form.dailyRate} onChange={e => handleChange("dailyRate", e.target.value)} required />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Description</label>
        <textarea className="textarea textarea-bordered w-full" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} />
      </div>
      <div className="mb-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} className="checkbox" />
          <span>Active</span>
        </label>
      </div>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`}>Save</button>
    </form>
  );
}