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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL + "/vehicles")
      .then(res => setVehicles(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVehicles([]));
    axios.get(process.env.REACT_APP_API_URL + `/tours/${id}`)
      .then(res => {
        const t = res.data;
        setForm({
          name: t.name || "",
          description: t.description || "",
          recommendedTimes: t.recommendedTimes || "",
          highlights: Array.isArray(t.highlights) ? t.highlights : [],
          duration: t.duration || "",
          whatToCarry: Array.isArray(t.whatToCarry) ? t.whatToCarry : [],
          gallery: Array.isArray(t.gallery) ? t.gallery : [],
          vehicles: Array.isArray(t.vehicles) ? t.vehicles.map(v => v._id) : [],
          priceResidentAdult: t.priceResidentAdult || "",
          priceResidentChild: t.priceResidentChild || "",
          priceForeignerAdult: t.priceForeignerAdult || "",
          priceForeignerChild: t.priceForeignerChild || "",
          active: Boolean(t.active)
        });
        setGalleryPreview(Array.isArray(t.gallery) ? t.gallery : []);
      })
      .catch(() => {});
  }, [id]);

  // Image upload to cloudinary (multiple images)
  const uploadGalleryToCloudinary = async files => {
    const urls = [];
    for (let file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "your_upload_preset");
      try {
        const res = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", data);
        urls.push(res.data.secure_url);
      } catch (err) {
        // Optionally show error
      }
    }
    return urls;
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addHighlight = () => {
    if (highlightInput) {
      setForm(prev => ({ ...prev, highlights: [...prev.highlights, highlightInput] }));
      setHighlightInput("");
    }
  };
  const removeHighlight = idx => {
    setForm(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }));
  };

  const addCarry = () => {
    if (carryInput) {
      setForm(prev => ({ ...prev, whatToCarry: [...prev.whatToCarry, carryInput] }));
      setCarryInput("");
    }
  };
  const removeCarry = idx => {
    setForm(prev => ({ ...prev, whatToCarry: prev.whatToCarry.filter((_, i) => i !== idx) }));
  };

  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
    setGalleryPreview(files.map(file => URL.createObjectURL(file)));
  };

  const removeGalleryImage = idx => {
    setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
    setGalleryPreview(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    let galleryUrls = form.gallery;
    if (galleryFiles.length > 0) {
      const uploaded = await uploadGalleryToCloudinary(galleryFiles);
      galleryUrls = [...form.gallery, ...uploaded];
    }
    try {
      await axios.put(process.env.REACT_APP_API_URL + `/tours/${id}`,
        { ...form, gallery: galleryUrls },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.alert("Tour updated!");
      navigate("/tours");
    } catch (err) {
      window.alert("Failed to update tour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Edit Tour</h2>
      <input className="input input-bordered w-full mb-3" placeholder="Trip Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Recommended Times" value={form.recommendedTimes} onChange={e => handleChange("recommendedTimes", e.target.value)} />
      <input className="input input-bordered w-full mb-3" placeholder="Duration" value={form.duration} onChange={e => handleChange("duration", e.target.value)} />
      <div className="mb-3">
        <label className="block font-semibold">Highlights</label>
        <div className="flex gap-2 mb-2">
          <input className="input input-bordered flex-1" placeholder="Add highlight" value={highlightInput} onChange={e => setHighlightInput(e.target.value)} />
          <button type="button" className="btn btn-accent" onClick={addHighlight}>Add</button>
        </div>
        <ul className="list-disc ml-6">
          {form.highlights.map((h, i) => (
            <li key={i}>
              {h}
              <button type="button" className="btn btn-xs btn-error ml-2" onClick={() => removeHighlight(i)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-3">
        <label className="block font-semibold">What To Carry</label>
        <div className="flex gap-2 mb-2">
          <input className="input input-bordered flex-1" placeholder="Add item to carry" value={carryInput} onChange={e => setCarryInput(e.target.value)} />
          <button type="button" className="btn btn-accent" onClick={addCarry}>Add</button>
        </div>
        <ul className="list-disc ml-6">
          {form.whatToCarry.map((c, i) => (
            <li key={i}>
              {c}
              <button type="button" className="btn btn-xs btn-error ml-2" onClick={() => removeCarry(i)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-3">
        <label className="block font-semibold">Select Vehicles (if applicable):</label>
        <select multiple className="select select-bordered w-full h-24" value={form.vehicles} onChange={e => handleChange("vehicles", Array.from(e.target.selectedOptions, o => o.value))}>
          {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label className="block font-semibold">Gallery Images:</label>
        <input type="file" accept="image/*" multiple className="file-input file-input-bordered w-full" onChange={handleGalleryUpload} />
        <div className="flex gap-2 flex-wrap mt-2">
          {form.gallery.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt={`gallery${i}`} className="w-16 h-12 object-cover rounded" />
              <button type="button" className="btn btn-xs btn-error absolute top-0 right-0" onClick={() => removeGalleryImage(i)}>✕</button>
            </div>
          ))}
          {galleryPreview.map((url, i) => (
            <img key={`preview${i}`} src={url} alt={`preview${i}`} className="w-16 h-12 object-cover rounded opacity-60" />
          ))}
        </div>
      </div>
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Resident Adult Price" value={form.priceResidentAdult} onChange={e => handleChange("priceResidentAdult", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Resident Child Price" value={form.priceResidentChild} onChange={e => handleChange("priceResidentChild", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Foreigner Adult Price" value={form.priceForeignerAdult} onChange={e => handleChange("priceForeignerAdult", e.target.value)} required />
      <input type="number" className="input input-bordered w-full mb-3" placeholder="Foreigner Child Price" value={form.priceForeignerChild} onChange={e => handleChange("priceForeignerChild", e.target.value)} required />
      <label className="flex items-center gap-2 mb-3">
        <input type="checkbox" checked={form.active} onChange={e => handleChange("active", e.target.checked)} className="checkbox" />
        <span>Active</span>
      </label>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`}>Save</button>
    </form>
  );
}