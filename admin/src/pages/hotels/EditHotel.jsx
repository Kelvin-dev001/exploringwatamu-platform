import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function EditHotel() {
  const { id } = useParams();
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
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await axios.get(process.env.REACT_APP_API_URL + `/hotels/${id}`);
        const hotel = res.data;
        setForm({
          name: hotel.name || "",
          type: hotel.type || "",
          stars: hotel.stars ? String(hotel.stars) : "",
          location: hotel.location || "",
          description: hotel.description || "",
          facilities: hotel.facilities ? hotel.facilities.join(', ') : "",
          roomTypes: hotel.roomTypes ? hotel.roomTypes.join(', ') : "",
          images: [],
        });
        setExistingImages(hotel.images || []);
      } catch (err) {
        window.alert("Failed to load hotel");
      }
    };
    fetchHotel();
  }, [id]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm({ ...form, images: files });
    setPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleRemoveExistingImage = (idx) => {
    setExistingImages(existingImages.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("type", form.type);
      data.append("stars", form.stars);
      data.append("location", form.location);
      data.append("description", form.description);
      data.append("facilities", form.facilities);
      data.append("roomTypes", form.roomTypes);
      existingImages.forEach(url => data.append("images", url)); // send existing image URLs
      form.images.forEach(img => data.append("images", img));     // send new files

      await axios.put(process.env.REACT_APP_API_URL + `/hotels/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert("Hotel updated!");
      navigate("/hotels");
    } catch (err) {
      window.alert("Failed to update hotel");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Edit Hotel</h2>
      <input placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Type" value={form.type} onChange={e => handleChange("type", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Stars" type="number" min="1" max="5" value={form.stars} onChange={e => handleChange("stars", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Location" value={form.location} onChange={e => handleChange("location", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Facilities (comma separated)" value={form.facilities} onChange={e => handleChange("facilities", e.target.value)} style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <input placeholder="Room Types (comma separated)" value={form.roomTypes} onChange={e => handleChange("roomTypes", e.target.value)} style={{ display: "block", marginBottom: 12, width: "100%" }} />
      <label style={{ fontWeight: "bold", marginBottom: 8, display: "block" }}>Current Images:</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {existingImages.map((url, idx) => (
          <div key={url} style={{ position: "relative", display: "inline-block" }}>
            <img src={url} alt={`existing ${idx}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }} />
            <button type="button" onClick={() => handleRemoveExistingImage(idx)} style={{
              position: "absolute", top: 0, right: 0, background: "rgba(255,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer"
            }}>×</button>
          </div>
        ))}
      </div>
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