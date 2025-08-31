import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function NewVehicle() {
  const [form, setForm] = useState({ name: "", capacity: "", description: "", image: "" });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const uploadImageToCloudinary = async (file) => {
    if (!file) return "";
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "your_upload_preset");
    const res = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", data);
    return res.data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = form.image;
    if (imageFile) imageUrl = await uploadImageToCloudinary(imageFile);
    await axios.post(
      process.env.REACT_APP_API_URL + "/vehicles",
      { ...form, image: imageUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    window.alert("Vehicle created!");
    navigate("/vehicles");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Add Vehicle</h2>
      <input placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => handleChange("capacity", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: 12 }} />
      {preview && <img src={preview} alt="preview" style={{ width: 120, height: 80, objectFit: "cover", marginBottom: 12 }} />}
      <button type="submit">Save</button>
    </form>
  );
}