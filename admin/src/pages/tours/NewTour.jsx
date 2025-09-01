import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

export default function NewTour() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    recommendedTimes: "",
    highlights: [],
    duration: "",
    whatToCarry: [],
    gallery: [],
    vehicles: [],
    priceResidentAdult: "",
    priceResidentChild: "",
    priceForeignerAdult: "",
    priceForeignerChild: "",
    active: true
  });
  const [highlightInput, setHighlightInput] = useState("");
  const [carryInput, setCarryInput] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreview, setGalleryPreview] = useState([]);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
  }, []);

  // Image upload to cloudinary (multiple images)
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

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const addHighlight = () => {
    if (highlightInput) {
      setForm({ ...form, highlights: [...form.highlights, highlightInput] });
      setHighlightInput("");
    }
  };
  const addCarry = () => {
    if (carryInput) {
      setForm({ ...form, whatToCarry: [...form.whatToCarry, carryInput] });
      setCarryInput("");
    }
  };

  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
    setGalleryPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    let galleryUrls = form.gallery;
    if (galleryFiles.length > 0) {
      galleryUrls = await uploadGalleryToCloudinary(galleryFiles);
    }
    await axios.post(process.env.REACT_APP_API_URL + "/tours", { ...form, gallery: galleryUrls }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    window.alert("Tour created!");
    navigate("/tours");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Add Tour</h2>
      <input placeholder="Trip Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input placeholder="Recommended Times" value={form.recommendedTimes} onChange={e => handleChange("recommendedTimes", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <input placeholder="Duration" value={form.duration} onChange={e => handleChange("duration", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Add highlight" value={highlightInput} onChange={e => setHighlightInput(e.target.value)} />
        <button type="button" onClick={addHighlight}>Add</button>
        <ul>
          {form.highlights.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Add item to carry" value={carryInput} onChange={e => setCarryInput(e.target.value)} />
        <button type="button" onClick={addCarry}>Add</button>
        <ul>
          {form.whatToCarry.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Select Vehicles (if applicable):</label>
        <select multiple value={form.vehicles} onChange={e => handleChange("vehicles", Array.from(e.target.selectedOptions, o => o.value))} style={{ width: "100%", height: 80 }}>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Gallery Images:</label>
        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
        <div style={{ display: "flex", gap: 8 }}>
          {galleryPreview.map((url, i) => <img key={i} src={url} alt={`preview${i}`} style={{ width: 60, height: 40, objectFit: "cover" }} />)}
        </div>
      </div>
      <input type="number" placeholder="Resident Adult Price" value={form.priceResidentAdult} onChange={e => handleChange("priceResidentAdult", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input type="number" placeholder="Resident Child Price" value={form.priceResidentChild} onChange={e => handleChange("priceResidentChild", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input type="number" placeholder="Foreigner Adult Price" value={form.priceForeignerAdult} onChange={e => handleChange("priceForeignerAdult", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input type="number" placeholder="Foreigner Child Price" value={form.priceForeignerChild} onChange={e => handleChange("priceForeignerChild", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <label>
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} />
        Active
      </label>
      <button type="submit">Save</button>
    </form>
  );
}