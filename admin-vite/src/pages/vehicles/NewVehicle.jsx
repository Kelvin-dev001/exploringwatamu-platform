import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function NewVehicle() {
  const [form, setForm] = useState({ name: "", capacity: "", description: "", image: "" });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
    setLoading(true);
    let imageUrl = form.image;
    try {
      if (imageFile) imageUrl = await uploadImageToCloudinary(imageFile);
      await axios.post(
        process.env.REACT_APP_API_URL + "/vehicles",
        { ...form, image: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.alert("Vehicle created!");
      navigate("/vehicles");
    } catch {
      window.alert("Failed to create vehicle.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Add Vehicle</h2>
      <input className="input input-bordered w-full mb-3" placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Capacity" value={form.capacity} onChange={e => handleChange("capacity", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} />
      <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input file-input-bordered w-full mb-3" />
      {preview && <img src={preview} alt="preview" className="w-32 h-20 object-cover rounded mb-3" />}
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>Save</button>
    </form>
  );
}