import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function NewHotel() {
  const [form, setForm] = useState({
    name: "",
    type: "",
    stars: "",
    location: "",
    description: "",
    facilities: "",
    roomTypes: "",
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState([]);

  // Handle file upload and preview
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm(prev => ({ ...prev, images: files }));
    setPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare FormData
      const data = new FormData();
      data.append("name", form.name);
      data.append("type", form.type);
      data.append("stars", form.stars);
      data.append("location", form.location);
      data.append("description", form.description);
      data.append("facilities", form.facilities);
      data.append("roomTypes", form.roomTypes);
      form.images.forEach(img => data.append("images", img));

      await axios.post(process.env.REACT_APP_API_URL + "/hotels", data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      window.alert("Hotel created!");
      navigate("/hotels");
    } catch (err) {
      window.alert("Failed to create hotel");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Add Hotel</h2>
      <input className="input input-bordered w-full mb-3" placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Type" value={form.type} onChange={e => handleChange("type", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Stars" type="number" min="1" max="5" value={form.stars} onChange={e => handleChange("stars", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Location" value={form.location} onChange={e => handleChange("location", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Facilities (comma separated)" value={form.facilities} onChange={e => handleChange("facilities", e.target.value)} />
      <input className="input input-bordered w-full mb-3" placeholder="Room Types (comma separated)" value={form.roomTypes} onChange={e => handleChange("roomTypes", e.target.value)} />
      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="file-input file-input-bordered w-full mb-3" />
      <div className="flex gap-2 flex-wrap mb-3">
        {preview.map((url, idx) => (
          <img src={url} alt={`preview ${idx}`} key={idx} className="w-20 h-20 object-cover rounded opacity-60" />
        ))}
      </div>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}