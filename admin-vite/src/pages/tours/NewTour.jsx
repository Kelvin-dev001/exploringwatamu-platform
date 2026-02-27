import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../api.js";

export default function NewTour() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    name: "", description: "", recommendedTimes: "", highlights: [], duration: "",
    whatToCarry: [], vehicles: [], priceResidentAdult: "", priceResidentChild: "",
    priceForeignerAdult: "", priceForeignerChild: "", active: true
  });
  const [highlightInput, setHighlightInput] = useState("");
  const [carryInput, setCarryInput] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreview, setGalleryPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(API_URL + "/vehicles").then(res => setVehicles(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });
  const addHighlight = () => { if (highlightInput) { setForm(prev => ({ ...prev, highlights: [...prev.highlights, highlightInput] })); setHighlightInput(""); } };
  const removeHighlight = idx => setForm(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }));
  const addCarry = () => { if (carryInput) { setForm(prev => ({ ...prev, whatToCarry: [...prev.whatToCarry, carryInput] })); setCarryInput(""); } };
  const removeCarry = idx => setForm(prev => ({ ...prev, whatToCarry: prev.whatToCarry.filter((_, i) => i !== idx) }));
  const handleGalleryUpload = e => { const files = Array.from(e.target.files); setGalleryFiles(files); setGalleryPreview(files.map(f => URL.createObjectURL(f))); };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("recommendedTimes", form.recommendedTimes);
      data.append("duration", form.duration);
      data.append("highlights", JSON.stringify(form.highlights));
      data.append("whatToCarry", JSON.stringify(form.whatToCarry));
      data.append("vehicles", JSON.stringify(form.vehicles));
      data.append("priceResidentAdult", form.priceResidentAdult);
      data.append("priceResidentChild", form.priceResidentChild);
      data.append("priceForeignerAdult", form.priceForeignerAdult);
      data.append("priceForeignerChild", form.priceForeignerChild);
      data.append("active", form.active);
      galleryFiles.forEach(file => data.append("gallery", file));

      await axios.post(API_URL + "/tours", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert("Tour created!");
      navigate("/tours");
    } catch (err) {
      console.error("Tour create error:", err?.response?.data || err);
      window.alert(err?.response?.data?.error || "Failed to create tour.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Add Tour</h2>
      <input className="input input-bordered w-full mb-3" placeholder="Trip Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Recommended Times" value={form.recommendedTimes} onChange={e => handleChange("recommendedTimes", e.target.value)} />
      <input className="input input-bordered w-full mb-3" placeholder="Duration" value={form.duration} onChange={e => handleChange("duration", e.target.value)} />
      <div className="mb-3">
        <label className="block font-semibold mb-1">Highlights</label>
        <div className="flex gap-2 mb-2">
          <input className="input input-bordered flex-1" placeholder="Add highlight" value={highlightInput} onChange={e => setHighlightInput(e.target.value)} />
          <button type="button" className="btn btn-accent" onClick={addHighlight}>Add</button>
        </div>
        <ul className="list-disc ml-6">{form.highlights.map((h, i) => <li key={i}>{h} <button type="button" className="btn btn-xs btn-error ml-2" onClick={() => removeHighlight(i)}>Remove</button></li>)}</ul>
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">What To Carry</label>
        <div className="flex gap-2 mb-2">
          <input className="input input-bordered flex-1" placeholder="Add item to carry" value={carryInput} onChange={e => setCarryInput(e.target.value)} />
          <button type="button" className="btn btn-accent" onClick={addCarry}>Add</button>
        </div>
        <ul className="list-disc ml-6">{form.whatToCarry.map((c, i) => <li key={i}>{c} <button type="button" className="btn btn-xs btn-error ml-2" onClick={() => removeCarry(i)}>Remove</button></li>)}</ul>
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Select Vehicles (if applicable):</label>
        <select multiple className="select select-bordered w-full h-24" value={form.vehicles} onChange={e => handleChange("vehicles", Array.from(e.target.selectedOptions, o => o.value))}>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Gallery Images:</label>
        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="file-input file-input-bordered w-full mb-2" />
        <div className="flex gap-2">{galleryPreview.map((url, i) => <img key={i} src={url} alt={`preview${i}`} className="w-16 h-12 object-cover rounded" />)}</div>
      </div>
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Resident Adult Price" value={form.priceResidentAdult} onChange={e => handleChange("priceResidentAdult", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Resident Child Price" value={form.priceResidentChild} onChange={e => handleChange("priceResidentChild", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Foreigner Adult Price" value={form.priceForeignerAdult} onChange={e => handleChange("priceForeignerAdult", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Foreigner Child Price" value={form.priceForeignerChild} onChange={e => handleChange("priceForeignerChild", e.target.value)} required />
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" className="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} /> Active
      </label>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>Save</button>
    </form>
  );
}