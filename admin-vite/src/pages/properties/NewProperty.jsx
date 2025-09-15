import React, { useState } from "react";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

export default function NewProperty() {
  const [form, setForm] = useState({
    type: "villa",
    name: "",
    description: "",
    location: "",
    price: "",
    pictures: [],
    documents: [],
    active: true
  });
  const [pictureFiles, setPictureFiles] = useState([]);
  const [picturePreview, setPicturePreview] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentPreview, setDocumentPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  // Multiple image/document upload to cloudinary
  const uploadToCloudinary = async (files, resource_type = "image") => {
    const urls = [];
    for (let file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "your_upload_preset");
      const res = await axios.post(`https://api.cloudinary.com/v1_1/your_cloud_name/${resource_type}/upload`, data);
      urls.push(res.data.secure_url);
    }
    return urls;
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePictureUpload = e => {
    const files = Array.from(e.target.files);
    setPictureFiles(files);
    setPicturePreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleDocumentUpload = e => {
    const files = Array.from(e.target.files);
    setDocumentFiles(files);
    setDocumentPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    let pictureUrls = form.pictures;
    let documentUrls = form.documents;
    try {
      if (pictureFiles.length > 0) {
        pictureUrls = await uploadToCloudinary(pictureFiles, "image");
      }
      if (documentFiles.length > 0) {
        documentUrls = await uploadToCloudinary(documentFiles, "auto");
      }
      await axios.post(process.env.REACT_APP_API_URL + "/properties", { ...form, pictures: pictureUrls, documents: documentUrls }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.alert("Property created!");
      navigate("/properties");
    } catch {
      window.alert("Failed to create property.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Add Property For Sale</h2>
      <select className="select select-bordered w-full mb-3" value={form.type} onChange={e => handleChange("type", e.target.value)} required>
        <option value="villa">Villa</option>
        <option value="apartment">Apartment</option>
        <option value="land">Land</option>
      </select>
      <input className="input input-bordered w-full mb-3" placeholder="Property Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Location" value={form.location} onChange={e => handleChange("location", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Starting Price" value={form.price} onChange={e => handleChange("price", e.target.value)} required />
      <div className="mb-3">
        <label className="block font-semibold mb-1">Property Pictures:</label>
        <input type="file" accept="image/*" multiple onChange={handlePictureUpload} className="file-input file-input-bordered w-full mb-2" />
        <div className="flex gap-2">
          {picturePreview.map((url, i) => <img key={i} src={url} alt={`preview${i}`} className="w-16 h-10 object-cover rounded" />)}
        </div>
      </div>
      <div className="mb-3">
        <label className="block font-semibold mb-1">Property Documents (PDF, images):</label>
        <input type="file" multiple onChange={handleDocumentUpload} className="file-input file-input-bordered w-full mb-2" />
        <div className="flex gap-2">
          {documentPreview.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <span className="inline-block w-16 h-10 bg-base-200 rounded text-center leading-10">Doc {i + 1}</span>
            </a>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} className="checkbox" />
        Active
      </label>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>Save</button>
    </form>
  );
}