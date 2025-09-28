import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../../context/AdminAuthContext";
import DynamicFieldArray from "./DynamicFieldArray";

export default function EditHotel() {
  const { id } = useParams();
  const [form, setForm] = useState(null); // null until loaded
  const [loading, setLoading] = useState(false);
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await axios.get(process.env.REACT_APP_API_URL + `/hotels/${id}`);
        const hotel = res.data;
        setForm({
          name: hotel.name || "",
          type: hotel.type || "",
          stars: hotel.stars ? String(hotel.stars) : "",
          description: hotel.description || "",
          location: hotel.location || { address: "", mapUrl: "", coordinates: { lat: "", lng: "" } },
          facilities: hotel.facilities || [],
          popularFacilities: hotel.popularFacilities || [],
          roomTypes: hotel.roomTypes || [],
          faqs: hotel.faqs || [],
          houseRules: hotel.houseRules || [],
          contact: hotel.contact || { whatsapp: "", email: "" },
          images: [],
        });
        setExistingImages(Array.isArray(hotel.images) ? hotel.images : []);
      } catch (err) {
        window.alert("Failed to load hotel");
      }
    };
    fetchHotel();
  }, [id]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm(prev => ({ ...prev, images: files }));
    setPreview(files.map(file => URL.createObjectURL(file)));
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNestedChange = (field, key, value) =>
    setForm(prev => ({ ...prev, [field]: { ...prev[field], [key]: value } }));

  const handleRemoveExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
    existingImages.forEach(url => data.append("images", url));
    form.images.forEach(img => data.append("images", img));
    await axios.put(process.env.REACT_APP_API_URL + `/hotels/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLoading(false);
    window.alert("Hotel updated!");
    navigate("/hotels");
  };

  if (!form) return <div className="p-8 text-center">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-4 font-bold">Edit Hotel</h2>
      <input className="input input-bordered w-full mb-3" placeholder="Name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Type" value={form.type} onChange={e => handleChange("type", e.target.value)} required />
      <input className="input input-bordered w-full mb-3" placeholder="Stars" type="number" min="1" max="5" value={form.stars} onChange={e => handleChange("stars", e.target.value)} required />
      <textarea className="textarea textarea-bordered w-full mb-3" placeholder="Description" value={form.description} onChange={e => handleChange("description", e.target.value)} required />
      {/* Location */}
      <div className="mb-3">
        <div className="font-bold mb-1">Location</div>
        <input className="input input-bordered w-full mb-2" placeholder="Address" value={form.location.address} onChange={e => handleNestedChange("location", "address", e.target.value)} />
        <input className="input input-bordered w-full mb-2" placeholder="Map URL" value={form.location.mapUrl} onChange={e => handleNestedChange("location", "mapUrl", e.target.value)} />
        <div className="flex gap-2">
          <input className="input input-bordered flex-1" placeholder="Latitude" value={form.location.coordinates?.lat || ""} onChange={e => handleNestedChange("location", "coordinates", { ...form.location.coordinates, lat: e.target.value })} />
          <input className="input input-bordered flex-1" placeholder="Longitude" value={form.location.coordinates?.lng || ""} onChange={e => handleNestedChange("location", "coordinates", { ...form.location.coordinates, lng: e.target.value })} />
        </div>
      </div>
      {/* Facilities */}
      <DynamicFieldArray
        label="Facilities"
        fields={form.facilities}
        onChange={facilities => setForm(prev => ({ ...prev, facilities }))}
        renderItem={(val, onChange) => (
          <input className="input input-bordered" placeholder="Facility" value={val} onChange={e => onChange(e.target.value)} />
        )}
        emptyItem=""
      />
      {/* Popular Facilities */}
      <DynamicFieldArray
        label="Popular Facilities"
        fields={form.popularFacilities}
        onChange={popularFacilities => setForm(prev => ({ ...prev, popularFacilities }))}
        renderItem={(val, onChange) => (
          <input className="input input-bordered" placeholder="Popular Facility" value={val} onChange={e => onChange(e.target.value)} />
        )}
        emptyItem=""
      />
      {/* Room Types */}
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
      {/* FAQs */}
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
      {/* House Rules */}
      <DynamicFieldArray
        label="House Rules"
        fields={form.houseRules}
        onChange={houseRules => setForm(prev => ({ ...prev, houseRules }))}
        renderItem={(val, onChange) => (
          <input className="input input-bordered" placeholder="Rule" value={val} onChange={e => onChange(e.target.value)} />
        )}
        emptyItem=""
      />
      {/* Contact */}
      <div className="mb-3">
        <div className="font-bold mb-1">Contact</div>
        <input className="input input-bordered w-full mb-2" placeholder="WhatsApp" value={form.contact.whatsapp} onChange={e => handleNestedChange("contact", "whatsapp", e.target.value)} />
        <input className="input input-bordered w-full mb-2" placeholder="Email" value={form.contact.email} onChange={e => handleNestedChange("contact", "email", e.target.value)} />
      </div>
      {/* Images */}
      <label className="block font-bold mb-2">Current Images:</label>
      <div className="flex gap-2 flex-wrap mb-3">
        {existingImages.map((url, idx) => (
          <div key={url} className="relative inline-block">
            <img src={url} alt={`existing ${idx}`} className="w-20 h-20 object-cover rounded" />
            <button type="button"
              onClick={() => handleRemoveExistingImage(idx)}
              className="btn btn-xs btn-error absolute top-0 right-0 rounded-full">
              ×
            </button>
          </div>
        ))}
      </div>
      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="file-input file-input-bordered w-full mb-3" />
      <div className="flex gap-2 flex-wrap mb-3">
        {preview.map((url, idx) => (
          <img src={url} alt={`preview ${idx}`} key={idx} className="w-20 h-20 object-cover rounded opacity-60" />
        ))}
      </div>
      <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
    </form>
  );
}