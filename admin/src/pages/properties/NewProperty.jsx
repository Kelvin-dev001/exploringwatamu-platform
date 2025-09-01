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
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  // Multiple image upload to cloudinary
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

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

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
    let pictureUrls = form.pictures;
    let documentUrls = form.documents;
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
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 32, maxWidth: 600 }}>
      <h2>Add Property For Sale</h2>
      <select value={form.type} onChange={e => handleChange("type", e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="villa">Villa</option>
        <option value="apartment">Apartment</option>
        <option value="land">Land</option>
      </select>
      <input placeholder="Property Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <textarea placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input placeholder="Location" value={form.location} onChange={e => handleChange("location", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input type="number" placeholder="Starting Price" value={form.price} onChange={e => handleChange("price", e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        <label>Property Pictures:</label>
        <input type="file" accept="image/*" multiple onChange={handlePictureUpload} />
        <div style={{ display: "flex", gap: 8 }}>
          {picturePreview.map((url, i) => <img key={i} src={url} alt={`preview${i}`} style={{ width: 60, height: 40, objectFit: "cover" }} />)}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Property Documents (PDF, images):</label>
        <input type="file" multiple onChange={handleDocumentUpload} />
        <div style={{ display: "flex", gap: 8 }}>
          {documentPreview.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <span style={{ display: "inline-block", width: 60, height: 40, background: "#eee", borderRadius: 4, textAlign: "center", lineHeight: "40px" }}>Doc {i + 1}</span>
            </a>
          ))}
        </div>
      </div>
      <label>
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} />
        Active
      </label>
      <button type="submit">Save</button>
    </form>
  );
}