import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

const TYPES = ["villa", "apartment", "land"];

export default function EditProperty() {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    type: "", name: "", description: "", location: "", price: "",
    pictures: [], documents: [], active: true
  });
  const [pictureFiles, setPictureFiles] = useState([]);
  const [picturePreview, setPicturePreview] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentPreview, setDocumentPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(API_URL + `/properties/${id}`).then(res => {
      const p = res.data;
      setForm({
        type: p.type || "", name: p.name || "", description: p.description || "",
        location: p.location || "", price: p.price || "",
        pictures: Array.isArray(p.pictures) ? p.pictures : [],
        documents: Array.isArray(p.documents) ? p.documents : [],
        active: Boolean(p.active)
      });
      setPicturePreview(Array.isArray(p.pictures) ? p.pictures : []);
      setDocumentPreview(Array.isArray(p.documents) ? p.documents : []);
    }).catch(() => {});
  }, [id]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePictureUpload = e => {
    const files = Array.from(e.target.files);
    setPictureFiles(files);
    setPicturePreview([...form.pictures, ...files.map(file => URL.createObjectURL(file))]);
  };
  const handleDocumentUpload = e => {
    const files = Array.from(e.target.files);
    setDocumentFiles(files);
    setDocumentPreview([...form.documents, ...files.map(file => URL.createObjectURL(file))]);
  };
  const removePicture = idx => {
    setForm(prev => ({ ...prev, pictures: prev.pictures.filter((_, i) => i !== idx) }));
    setPicturePreview(prev => prev.filter((_, i) => i !== idx));
  };
  const removeDocument = idx => {
    setForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }));
    setDocumentPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("type", form.type);
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("location", form.location);
      data.append("price", form.price);
      data.append("active", form.active);
      // Send existing picture URLs so backend knows to keep them
      data.append("existingPictures", JSON.stringify(form.pictures));
      data.append("existingDocuments", JSON.stringify(form.documents));
      pictureFiles.forEach(file => data.append("pictures", file));
      documentFiles.forEach(file => data.append("documents", file));

      await axios.put(API_URL + `/properties/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert("Property updated!");
      navigate("/properties");
    } catch (err) {
      console.error("Property update error:", err?.response?.data || err);
      window.alert(err?.response?.data?.error || "Failed to update property.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Edit Property</h2>
      <select className="select select-bordered w-full mb-3" value={form.type} onChange={e => handleChange("type", e.target.value)} required>
        <option value="">Select type</option>
        {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
      </select>
      <input className="input input-bordered w-full mb-3" placeholder="Property Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Location" value={form.location} onChange={e => handleChange("location", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Starting Price" value={form.price} onChange={e => handleChange("price", e.target.value)} required />
      <div className="mb-3">
        <label className="block font-semibold mb-1">Property Pictures:</label>
        <input type="file" accept="image/*" multiple onChange={handlePictureUpload} className="file-input file-input-bordered w-full mb-2" />
        <div className="flex gap-2 flex-wrap">
          {form.pictures.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt={`pic${i}`} className="w-16 h-10 object-cover rounded" />
              <button type="button" className="btn btn-xs btn-error absolute top-0 right-0" onClick={() => removePicture(i)}>✕</button>
            </div>
          ))}
          {picturePreview.slice(form.pictures.length).map((url, i) => (
            <img key={`preview${i}`} src={url} alt={`preview${i}`} className="w-16 h-10 object-cover rounded opacity-60" />
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Property Documents (PDF, images):</label>
        <input type="file" multiple onChange={handleDocumentUpload} className="file-input file-input-bordered w-full mb-2" />
        <div className="flex gap-2 flex-wrap">
          {form.documents.map((url, i) => (
            <div key={i} className="relative">
              <a href={url} target="_blank" rel="noopener noreferrer"><span className="inline-block w-16 h-10 bg-base-200 rounded text-center leading-10">Doc {i + 1}</span></a>
              <button type="button" className="btn btn-xs btn-error absolute top-0 right-0" onClick={() => removeDocument(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} className="checkbox" /> Active
      </label>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>Save</button>
    </form>
  );
}