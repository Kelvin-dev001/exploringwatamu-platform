import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function EditService() {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", description: "", pricingType: "hourly", price: "",
    availableDays: [], availableHours: { start: "", end: "" }, gallery: [], active: true
  });
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreview, setGalleryPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(API_URL + `/services/${id}`).then(res => {
      const s = res.data;
      setForm({
        name: s.name || "", description: s.description || "", pricingType: s.pricingType || "hourly",
        price: s.price || "", availableDays: s.availableDays || [],
        availableHours: s.availableHours || { start: "", end: "" },
        gallery: s.gallery || [], active: Boolean(s.active)
      });
      setGalleryPreview(s.gallery || []);
    }).catch(() => {});
  }, [id]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });
  const handleDayToggle = day => {
    setForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
    setGalleryPreview([...form.gallery, ...files.map(file => URL.createObjectURL(file))]);
  };
  const removeGalleryImage = idx => {
    setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
    setGalleryPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("pricingType", form.pricingType);
      data.append("price", form.price);
      data.append("availableDays", JSON.stringify(form.availableDays));
      data.append("availableHours", JSON.stringify(form.availableHours));
      data.append("active", form.active);
      data.append("existingGallery", JSON.stringify(form.gallery));
      galleryFiles.forEach(file => data.append("gallery", file));

      await axios.put(API_URL + `/services/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert("Service updated!");
      navigate("/services");
    } catch (err) {
      console.error("Service update error:", err?.response?.data || err);
      window.alert(err?.response?.data?.error || "Failed to update service.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Edit Service</h2>
      <input className="input input-bordered w-full mb-3" placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
      <select className="select select-bordered w-full mb-3" value={form.pricingType} onChange={e => handleChange("pricingType", e.target.value)} required>
        <option value="hourly">Hourly</option>
        <option value="daily">Daily</option>
      </select>
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Price" value={form.price} onChange={e => handleChange("price", e.target.value)} required />
      <div className="mb-3">
        <label className="block font-semibold mb-1">Available Days:</label>
        <div className="flex gap-3 flex-wrap">
          {DAYS.map(day => (
            <label key={day} className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm" checked={form.availableDays.includes(day)} onChange={() => handleDayToggle(day)} />
              <span className="text-sm">{day}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Available Hours:</label>
        <div className="flex items-center gap-2">
          <input type="time" className="input input-bordered" value={form.availableHours.start} onChange={e => handleChange("availableHours", { ...form.availableHours, start: e.target.value })} required />
          <span>-</span>
          <input type="time" className="input input-bordered" value={form.availableHours.end} onChange={e => handleChange("availableHours", { ...form.availableHours, end: e.target.value })} required />
        </div>
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Gallery Images:</label>
        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="file-input file-input-bordered w-full mb-2" />
        <div className="flex gap-2 flex-wrap">
          {form.gallery.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt={`gallery${i}`} className="w-16 h-10 object-cover rounded" />
              <button type="button" className="btn btn-xs btn-error absolute top-0 right-0" onClick={() => removeGalleryImage(i)}>✕</button>
            </div>
          ))}
          {galleryPreview.slice(form.gallery.length).map((url, i) => (
            <img key={`preview${i}`} src={url} alt={`preview${i}`} className="w-16 h-10 object-cover rounded opacity-60" />
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" className="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} /> Active
      </label>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>Save</button>
    </form>
  );
}