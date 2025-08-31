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
    setForm({ ...form, images: files });
    setPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

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

      const res = await axios.post(process.env.REACT_APP_API_URL + "/hotels", data, {
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
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Add Hotel</h2>
      <input placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Type" value={form.type} onChange={e => handleChange("type", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Stars" type="number" min="1" max="5" value={form.stars} onChange={e => handleChange("stars", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Location" value={form.location} onChange={e => handleChange("location", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Facilities (comma separated)" value={form.facilities} onChange={e => handleChange("facilities", e.target.value)} style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Room Types (comma separated)" value={form.roomTypes} onChange={e => handleChange("roomTypes", e.target.value)} style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "block", marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {preview.map((url, idx) => (
          <img src={url} alt={`preview ${idx}`} key={idx} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }} />
        ))}
      </div>
      <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}