import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function EditCarHire() {
  const { id } = useParams();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicle: "", dailyRate: "", description: "", active: true });
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles")
      .then(res => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVehicles([]));
    axios.get(process.env.REACT_APP_API_URL + `/carhires/${id}`)
      .then(res => {
        const c = res.data;
        setForm({
          vehicle: c.vehicle?._id || "",
          dailyRate: c.dailyRate || "",
          description: c.description || "",
          active: Boolean(c.active)
        });
      })
      .catch(() => {});
  }, [id]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(process.env.REACT_APP_API_URL + `/carhires/${id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      window.alert("Car hire option updated!");
      navigate("/carhires");
    } catch {
      window.alert("Failed to update car hire option.");
    }
    setLoading(false);
  };

  const selectedVehicle = vehicles.find(v => v._id === form.vehicle);

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Edit Car Hire Option</h2>
      <select className="select select-bordered w-full mb-3" value={form.vehicle} onChange={e => handleChange("vehicle", e.target.value)} required>
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
      </select>
      {selectedVehicle && selectedVehicle.image && (
        <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-32 h-20 object-cover rounded mb-3" />
      )}
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Daily Rate" value={form.dailyRate} onChange={e => handleChange("dailyRate", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} />
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} className="checkbox" />
        <span>Active</span>
      </label>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`}>Save</button>
    </form>
  );
}