import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

export default function EditVehicle() {
  const { id } = useParams();
  const [form, setForm] = useState({ name: "", capacity: "", description: "", image: "" });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(API_URL + `/vehicles/${id}`).then(res => {
      setForm({
        name: res.data.name || "",
        capacity: res.data.capacity || "",
        description: res.data.description || "",
        image: res.data.image || ""
      });
      setPreview(res.data.image || "");
    }).catch(() => {});
  }, [id]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : (form.image || ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("capacity", form.capacity);
      data.append("description", form.description);
      if (imageFile) {
        data.append("image", imageFile);
      } else {
        data.append("existingImage", form.image);
      }

      await axios.put(API_URL + `/vehicles/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert("Vehicle updated!");
      navigate("/vehicles");
    } catch (err) {
      console.error("Vehicle update error:", err?.response?.data || err);
      window.alert(err?.response?.data?.error || "Failed to update vehicle.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Edit Vehicle</h2>
      <input className="input input-bordered w-full mb-3" placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Capacity" value={form.capacity} onChange={e => handleChange("capacity", e.target.value)} />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} />
      <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input file-input-bordered w-full mb-3" />
      {preview && <img src={preview} alt="preview" className="w-32 h-20 object-cover rounded mb-3" />}
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>Save</button>
    </form>
  );
}