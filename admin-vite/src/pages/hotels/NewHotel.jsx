import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import DynamicFieldArray from "./DynamicFieldArray";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TABS = [
  { key: "basic", label: "Basic Info" },
  { key: "rooms", label: "Rooms & Facilities" },
  { key: "details", label: "FAQs & Rules" },
  { key: "contact", label: "Contact & Images" },
];

export default function NewHotel() {
  const [form, setForm] = useState({
    name: "",
    type: "",
    stars: "",
    description: "",
    location: { address: "", mapUrl: "", coordinates: { lat: "", lng: "" } },
    facilities: [],
    popularFacilities: [],
    roomTypes: [],
    faqs: [],
    houseRules: [],
    contact: { whatsapp: "", email: "" },
    images: [],
  });
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState([]);

  // Image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm(prev => ({ ...prev, images: files }));
    setPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleNestedChange = (field, key, value) =>
    setForm(prev => ({ ...prev, [field]: { ...prev[field], [key]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("type", form.type);
      
      data.append("stars", form.stars);
      data.append("description", form.description);
      data.append("location", JSON.stringify(form.location));
      data.append("facilities", JSON.stringify(form.facilities));
      data.append("popularFacilities", JSON.stringify(form.popularFacilities));
      data.append("roomTypes", JSON.stringify(form.roomTypes));
      data.append("faqs", JSON.stringify(form.faqs));
      data.append("houseRules", JSON.stringify(form.houseRules));
      data.append("contact", JSON.stringify(form.contact));
      form.images.forEach(img => data.append("images", img));
      await axios.post(import.meta.env.VITE_API_URL + "/hotels", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Hotel created!");
      navigate("/hotels");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        "Failed to create hotel. Please check your network and form fields."
      );
      console.error("Hotel create error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <ToastContainer />
      <h2 className="text-2xl mb-4 font-bold">Add Hotel</h2>
      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button type="button" key={tab.key}
            className={`btn btn-sm ${activeTab === tab.key ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab(tab.key)}
          >{tab.label}</button>
        ))}
      </div>
      {activeTab === "basic" && (
        <>
          <input className="input input-bordered w-full mb-3" placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
          <input className="input input-bordered w-full mb-3" placeholder="Type" value={form.type} onChange={e => handleChange("type", e.target.value)} required />
          <input className="input input-bordered w-full mb-3" placeholder="Stars" type="number" min="1" max="5" value={form.stars} onChange={e => handleChange("stars", e.target.value)} required />
          <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
          <div className="mb-3">
            <div className="font-bold mb-1">Location</div>
            <input className="input input-bordered w-full mb-2" placeholder="Address" value={form.location.address} onChange={e => handleNestedChange("location", "address", e.target.value)} />
            <input className="input input-bordered w-full mb-2" placeholder="Map URL" value={form.location.mapUrl} onChange={e => handleNestedChange("location", "mapUrl", e.target.value)} />
            <div className="flex gap-2">
              <input className="input input-bordered flex-1" placeholder="Latitude" value={form.location.coordinates.lat} onChange={e => handleNestedChange("location", "coordinates", { ...form.location.coordinates, lat: e.target.value })} />
              <input className="input input-bordered flex-1" placeholder="Longitude" value={form.location.coordinates.lng} onChange={e => handleNestedChange("location", "coordinates", { ...form.location.coordinates, lng: e.target.value })} />
            </div>
          </div>
        </>
      )}
      {activeTab === "rooms" && (
        <>
          <DynamicFieldArray
            label="Facilities"
            fields={form.facilities}
            onChange={facilities => setForm(prev => ({ ...prev, facilities }))}
            renderItem={(val, onChange) => (
              <input className="input input-bordered" placeholder="Facility" value={val} onChange={e => onChange(e.target.value)} />
            )}
            emptyItem=""
          />
          <DynamicFieldArray
            label="Popular Facilities"
            fields={form.popularFacilities}
            onChange={popularFacilities => setForm(prev => ({ ...prev, popularFacilities }))}
            renderItem={(val, onChange) => (
              <input className="input input-bordered" placeholder="Popular Facility" value={val} onChange={e => onChange(e.target.value)} />
            )}
            emptyItem=""
          />
          <DynamicFieldArray
            label="Room Types"
            fields={form.roomTypes}
            onChange={roomTypes => setForm(prev => ({ ...prev, roomTypes }))}
            renderItem={(room, onChange) => (
              <div className="flex gap-2">
                <input className="input input-bordered w-24" placeholder="Name" value={room.name || ""} onChange={e => onChange({ ...room, name: e.target.value })} />
                <input className="input input-bordered w-20" placeholder="Price" type="number" value={room.price || ""} onChange={e => onChange({ ...room, price: e.target.value })} />
                <input className="input input-bordered w-32" placeholder="Description" value={room.description || ""} onChange={e => onChange({ ...room, description: e.target.value })} />
                <input className="input input-bordered w-24" placeholder="Amenities (comma)" value={room.amenities?.join(', ') || ""} onChange={e => onChange({ ...room, amenities: e.target.value.split(',').map(f=>f.trim()) })} />
                <select className="select select-bordered w-20" value={room.availability ? "true" : "false"} onChange={e => onChange({ ...room, availability: e.target.value === "true" })}>
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
              </div>
            )}
            emptyItem={{ name: "", price: "", description: "", amenities: [], availability: true }}
          />
        </>
      )}
      {activeTab === "details" && (
        <>
          <DynamicFieldArray
            label="FAQs"
            fields={form.faqs}
            onChange={faqs => setForm(prev => ({ ...prev, faqs }))}
            renderItem={(faq, onChange) => (
              <div className="flex gap-2">
                <input className="input input-bordered w-36" placeholder="Question" value={faq.question || ""} onChange={e => onChange({ ...faq, question: e.target.value })} />
                <input className="input input-bordered w-36" placeholder="Answer" value={faq.answer || ""} onChange={e => onChange({ ...faq, answer: e.target.value })} />
              </div>
            )}
            emptyItem={{ question: "", answer: "" }}
          />
          <DynamicFieldArray
            label="House Rules"
            fields={form.houseRules}
            onChange={houseRules => setForm(prev => ({ ...prev, houseRules }))}
            renderItem={(val, onChange) => (
              <input className="input input-bordered" placeholder="Rule" value={val} onChange={e => onChange(e.target.value)} />
            )}
            emptyItem=""
          />
        </>
      )}
      {activeTab === "contact" && (
        <>
          <div className="mb-3">
            <div className="font-bold mb-1">Contact</div>
            <input className="input input-bordered w-full mb-2" placeholder="WhatsApp" value={form.contact.whatsapp} onChange={e => handleNestedChange("contact", "whatsapp", e.target.value)} />
            <input className="input input-bordered w-full mb-2" placeholder="Email" value={form.contact.email} onChange={e => handleNestedChange("contact", "email", e.target.value)} />
          </div>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="file-input file-input-bordered w-full mb-3" />
          <div className="flex gap-2 flex-wrap mb-3">
            {preview.map((url, idx) => (
              <img src={url} alt={`preview ${idx}`} key={idx} className="w-20 h-20 object-cover rounded opacity-60" />
            ))}
          </div>
        </>
      )}
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}