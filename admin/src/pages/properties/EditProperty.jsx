import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function EditService() {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    pricingType: "hourly",
    price: "",
    availableDays: [],
    availableHours: { start: "", end: "" },
    gallery: [],
    active: true
  });
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreview, setGalleryPreview] = useState([]);

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + `/services/${id}`).then(res => {
      const s = res.data;
      setForm({
        name: s.name,
        description: s.description,
        pricingType: s.pricingType,
        price: s.price,
        availableDays: s.availableDays || [],
        availableHours: s.availableHours || { start: "", end: "" },
        gallery: s.gallery || [],
        active: s.active
      });
      setGalleryPreview(s.gallery || []);
    });
  }, [id]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });
  const handleDayToggle = day => {
    setForm(form => ({
      ...form,
      availableDays: form.availableDays.includes(day)
        ? form.availableDays.filter(d => d !== day)
        : [...form.availableDays, day]
    }));
  };

  // Multiple image upload to cloudinary
  const uploadGalleryToCloudinary = async files => {
    const urls = [];
    for (let file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "your_upload_preset");
      const res = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", data);
      urls.push(res.data.secure_url);
    }
    return urls;
  };

  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
    setGalleryPreview([...form.gallery, ...files.map(file => URL.createObjectURL(file))]);
  };

  const removeGalleryImage = idx => {
    setForm(form => ({
      ...form,
      gallery: form.gallery.filter((_, i) => i !== idx)
    }));
    setGalleryPreview(galleryPreview.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    let galleryUrls = form.gallery;
    if (galleryFiles.length > 0) {
      const uploaded = await uploadGalleryToCloudinary(galleryFiles);
      galleryUrls = [...form.gallery, ...uploaded];
    }
    await axios.put(process.env.REACT_APP_API_URL + `/services/${id}`, { ...form, gallery: galleryUrls }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    window.alert("Service updated!");
    navigate("/services");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Edit Service</h2>
      <input
        placeholder="Name"
        value={form.name}
        onChange={e => handleChange("name", e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12 }}
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={e => handleChange("description", e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12 }}
      />
      <select
        value={form.pricingType}
        onChange={e => handleChange("pricingType", e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12 }}
      >
        <option value="hourly">Hourly</option>
        <option value="daily">Daily</option>
      </select>
      <input
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={e => handleChange("price", e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12 }}
      />
      <div style={{ marginBottom: 12 }}>
        <label>Available Days:</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DAYS.map(day => (
            <label key={day}>
              <input
                type="checkbox"
                checked={form.availableDays.includes(day)}
                onChange={() => handleDayToggle(day)}
              />
              {day}
            </label>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Available Hours:</label>
        <input
          type="time"
          value={form.availableHours.start}
          onChange={e => handleChange("availableHours", { ...form.availableHours, start: e.target.value })}
          required
        />
        <span> - </span>
        <input
          type="time"
          value={form.availableHours.end}
          onChange={e => handleChange("availableHours", { ...form.availableHours, end: e.target.value })}
          required
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Gallery Images:</label>
        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {form.gallery.map((url, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={url} alt={`gallery${i}`} style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }} />
              <button
                type="button"
                style={{ position: "absolute", top: 0, right: 0, color: "red" }}
                onClick={() => removeGalleryImage(i)}
              >✕</button>
            </div>
          ))}
          {galleryPreview.slice(form.gallery.length).map((url, i) => (
            <img key={`preview${i}`} src={url} alt={`preview${i}`} style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4, opacity: 0.6 }} />
          ))}
        </div>
      </div>
      <label>
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => handleChange("active", e.target.checked)}
        />
        Active
      </label>
      <button type="submit">Save</button>
    </form>
  );
}