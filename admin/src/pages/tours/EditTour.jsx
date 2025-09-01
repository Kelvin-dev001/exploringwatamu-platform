import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function EditTour() {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles").then(res => setVehicles(res.data));
    axios.get(process.env.REACT_APP_API_URL + `/tours/${id}`).then(res => {
      const t = res.data;
      setForm({
        name: t.name,
        description: t.description,
        recommendedTimes: t.recommendedTimes || "",
        highlights: t.highlights || [],
        duration: t.duration || "",
        whatToCarry: t.whatToCarry || [],
        gallery: t.gallery || [],
        vehicles: t.vehicles ? t.vehicles.map(v => v._id) : [],
        priceResidentAdult: t.priceResidentAdult,
        priceResidentChild: t.priceResidentChild,
        priceForeignerAdult: t.priceForeignerAdult,
        priceForeignerChild: t.priceForeignerChild,
        active: t.active
      });
      setGalleryPreview(t.gallery || []);
    });
  }, [id]);

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
  const removeHighlight = idx => {
    setForm({ ...form, highlights: form.highlights.filter((_, i) => i !== idx) });
  };

  const addCarry = () => {
    if (carryInput) {
      setForm({ ...form, whatToCarry: [...form.whatToCarry, carryInput] });
      setCarryInput("");
    }
  };
  const removeCarry = idx => {
    setForm({ ...form, whatToCarry: form.whatToCarry.filter((_, i) => i !== idx) });
  };

  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
    setGalleryPreview(files.map(file => URL.createObjectURL(file)));
  };

  const removeGalleryImage = idx => {
    setForm({ ...form, gallery: form.gallery.filter((_, i) => i !== idx) });
    setGalleryPreview(galleryPreview.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    let galleryUrls = form.gallery;
    if (galleryFiles.length > 0) {
      const uploaded = await uploadGalleryToCloudinary(galleryFiles);
      galleryUrls = [...form.gallery, ...uploaded];
    }
    await axios.put(process.env.REACT_APP_API_URL + `/tours/${id}`, { ...form, gallery: galleryUrls }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    window.alert("Tour updated!");
    navigate("/tours");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Edit Tour</h2>
      <input placeholder="Trip Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input placeholder="Recommended Times" value={form.recommendedTimes} onChange={e => handleChange("recommendedTimes", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <input placeholder="Duration" value={form.duration} onChange={e => handleChange("duration", e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Add highlight" value={highlightInput} onChange={e => setHighlightInput(e.target.value)} />
        <button type="button" onClick={addHighlight}>Add</button>
        <ul>
          {form.highlights.map((h, i) => (
            <li key={i}>
              {h}
              <button type="button" style={{ marginLeft: 8, color: "red" }} onClick={() => removeHighlight(i)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Add item to carry" value={carryInput} onChange={e => setCarryInput(e.target.value)} />
        <button type="button" onClick={addCarry}>Add</button>
        <ul>
          {form.whatToCarry.map((c, i) => (
            <li key={i}>
              {c}
              <button type="button" style={{ marginLeft: 8, color: "red" }} onClick={() => removeCarry(i)}>Remove</button>
            </li>
          ))}
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {form.gallery.map((url, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={url} alt={`gallery${i}`} style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }} />
              <button type="button" style={{ position: "absolute", top: 0, right: 0, color: "red" }} onClick={() => removeGalleryImage(i)}>✕</button>
            </div>
          ))}
          {galleryPreview.map((url, i) => (
            <img key={`preview${i}`} src={url} alt={`preview${i}`} style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4, opacity: 0.6 }} />
          ))}
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