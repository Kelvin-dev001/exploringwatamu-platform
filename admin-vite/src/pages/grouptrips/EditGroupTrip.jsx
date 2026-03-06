import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_URL } from "../../api.js";

export default function EditGroupTrip() {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    startDate: "",
    endDate: "",
    balanceDueDate: "",
    meetingPoint: "",
    accommodationDetails: "",
    maxParticipants: "",
    fullPrice: "",
    depositAmount: "",
    itinerary: [],
    includes: [],
    excludes: [],
    status: "draft",
    existingHeroImage: "",
    existingGallery: [],
  });
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreview, setGalleryPreview] = useState([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await axios.get(API_URL + "/group-trips/admin/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const trips = Array.isArray(res.data) ? res.data : [];
        const trip = trips.find((t) => t._id === id);
        if (trip) {
          setForm({
            title: trip.title || "",
            shortDescription: trip.shortDescription || "",
            fullDescription: trip.fullDescription || "",
            startDate: trip.startDate ? trip.startDate.substring(0, 10) : "",
            endDate: trip.endDate ? trip.endDate.substring(0, 10) : "",
            balanceDueDate: trip.balanceDueDate ? trip.balanceDueDate.substring(0, 10) : "",
            meetingPoint: trip.meetingPoint || "",
            accommodationDetails: trip.accommodationDetails || "",
            maxParticipants: trip.maxParticipants || "",
            fullPrice: trip.fullPrice || "",
            depositAmount: trip.depositAmount || "",
            itinerary: Array.isArray(trip.itinerary) ? trip.itinerary : [],
            includes: Array.isArray(trip.includes) ? trip.includes : [],
            excludes: Array.isArray(trip.excludes) ? trip.excludes : [],
            status: trip.status || "draft",
            existingHeroImage: trip.heroImage || "",
            existingGallery: Array.isArray(trip.gallery) ? trip.gallery : [],
          });
          if (trip.heroImage) setHeroPreview(trip.heroImage);
        }
      } catch (err) {
        window.alert("Failed to load trip data.");
      }
      setFetching(false);
    };
    fetchTrip();
    // eslint-disable-next-line
  }, [id]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Includes / Excludes
  const addInclude = () => {
    if (includeInput.trim()) {
      setForm((prev) => ({ ...prev, includes: [...prev.includes, includeInput.trim()] }));
      setIncludeInput("");
    }
  };
  const removeInclude = (idx) =>
    setForm((prev) => ({ ...prev, includes: prev.includes.filter((_, i) => i !== idx) }));

  const addExclude = () => {
    if (excludeInput.trim()) {
      setForm((prev) => ({ ...prev, excludes: [...prev.excludes, excludeInput.trim()] }));
      setExcludeInput("");
    }
  };
  const removeExclude = (idx) =>
    setForm((prev) => ({ ...prev, excludes: prev.excludes.filter((_, i) => i !== idx) }));

  // Itinerary
  const addDay = () => {
    setForm((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        { day: prev.itinerary.length + 1, title: "", activities: [] },
      ],
    }));
  };
  const removeDay = (idx) =>
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary
        .filter((_, i) => i !== idx)
        .map((d, i) => ({ ...d, day: i + 1 })),
    }));
  const updateDay = (idx, field, value) =>
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
    }));
  const addActivity = (dayIdx, activity) => {
    if (!activity.trim()) return;
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((d, i) =>
        i === dayIdx ? { ...d, activities: [...d.activities, activity.trim()] } : d
      ),
    }));
  };
  const removeActivity = (dayIdx, actIdx) =>
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((d, i) =>
        i === dayIdx
          ? { ...d, activities: d.activities.filter((_, j) => j !== actIdx) }
          : d
      ),
    }));

  // Images
  const handleHeroUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };
  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
    setGalleryPreview(files.map((f) => URL.createObjectURL(f)));
  };
  const removeExistingGallery = (idx) => {
    setForm((prev) => ({
      ...prev,
      existingGallery: prev.existingGallery.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("shortDescription", form.shortDescription);
      data.append("fullDescription", form.fullDescription);
      data.append("startDate", form.startDate);
      data.append("endDate", form.endDate);
      if (form.balanceDueDate) data.append("balanceDueDate", form.balanceDueDate);
      data.append("meetingPoint", form.meetingPoint);
      data.append("accommodationDetails", form.accommodationDetails);
      data.append("maxParticipants", form.maxParticipants);
      data.append("fullPrice", form.fullPrice);
      data.append("depositAmount", form.depositAmount);
      data.append("itinerary", JSON.stringify(form.itinerary));
      data.append("includes", JSON.stringify(form.includes));
      data.append("excludes", JSON.stringify(form.excludes));
      data.append("status", form.status);
      data.append("existingGallery", JSON.stringify(form.existingGallery));
      if (heroFile) data.append("heroImage", heroFile);
      galleryFiles.forEach((file) => data.append("gallery", file));

      await axios.put(API_URL + `/group-trips/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.alert("Group trip updated!");
      navigate("/grouptrips");
    } catch (err) {
      console.error("Update error:", err?.response?.data || err);
      window.alert(err?.response?.data?.error || "Failed to update group trip.");
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center p-16">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-base-100 p-8 shadow rounded">
      <h2 className="text-2xl mb-6 font-bold">Edit Group Trip</h2>

      {/* Basic Info */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Title *</label>
        <input
          className="input input-bordered w-full"
          placeholder="Trip title"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Short Description *</label>
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Brief summary"
          value={form.shortDescription}
          onChange={(e) => handleChange("shortDescription", e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Full Description</label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows={4}
          placeholder="Detailed description"
          value={form.fullDescription}
          onChange={(e) => handleChange("fullDescription", e.target.value)}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-semibold mb-1">Start Date *</label>
          <input
            type="date"
            className="input input-bordered w-full"
            value={form.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">End Date *</label>
          <input
            type="date"
            className="input input-bordered w-full"
            value={form.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Balance Due Date</label>
          <input
            type="date"
            className="input input-bordered w-full"
            value={form.balanceDueDate}
            onChange={(e) => handleChange("balanceDueDate", e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Meeting Point</label>
        <input
          className="input input-bordered w-full"
          placeholder="Meeting point"
          value={form.meetingPoint}
          onChange={(e) => handleChange("meetingPoint", e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Accommodation Details</label>
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Accommodation info"
          value={form.accommodationDetails}
          onChange={(e) => handleChange("accommodationDetails", e.target.value)}
        />
      </div>

      {/* Capacity & Pricing */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block font-semibold mb-1">Max Participants *</label>
          <input
            type="number"
            className="input input-bordered w-full"
            value={form.maxParticipants}
            onChange={(e) => handleChange("maxParticipants", e.target.value)}
            required
            min={1}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Full Price (KES) *</label>
          <input
            type="number"
            className="input input-bordered w-full"
            value={form.fullPrice}
            onChange={(e) => handleChange("fullPrice", e.target.value)}
            required
            min={0}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Deposit Amount (KES) *</label>
          <input
            type="number"
            className="input input-bordered w-full"
            value={form.depositAmount}
            onChange={(e) => handleChange("depositAmount", e.target.value)}
            required
            min={0}
          />
        </div>
      </div>

      {/* Itinerary */}
      <div className="mb-4">
        <label className="block font-semibold mb-2">Itinerary</label>
        {form.itinerary.map((day, dIdx) => (
          <ItineraryDay
            key={dIdx}
            day={day}
            dIdx={dIdx}
            onUpdate={updateDay}
            onRemoveDay={removeDay}
            onAddActivity={addActivity}
            onRemoveActivity={removeActivity}
          />
        ))}
        <button type="button" className="btn btn-sm btn-accent mt-2" onClick={addDay}>
          + Add Day
        </button>
      </div>

      {/* Includes */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">What's Included</label>
        <div className="flex gap-2 mb-2">
          <input
            className="input input-bordered flex-1"
            placeholder="Add inclusion"
            value={includeInput}
            onChange={(e) => setIncludeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
          />
          <button type="button" className="btn btn-accent" onClick={addInclude}>
            Add
          </button>
        </div>
        <ul className="list-disc ml-6">
          {form.includes.map((item, i) => (
            <li key={i}>
              {item}{" "}
              <button
                type="button"
                className="btn btn-xs btn-error ml-2"
                onClick={() => removeInclude(i)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Excludes */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">What's Excluded</label>
        <div className="flex gap-2 mb-2">
          <input
            className="input input-bordered flex-1"
            placeholder="Add exclusion"
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExclude())}
          />
          <button type="button" className="btn btn-accent" onClick={addExclude}>
            Add
          </button>
        </div>
        <ul className="list-disc ml-6">
          {form.excludes.map((item, i) => (
            <li key={i}>
              {item}{" "}
              <button
                type="button"
                className="btn btn-xs btn-error ml-2"
                onClick={() => removeExclude(i)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Images */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Hero Image</label>
        {heroPreview && (
          <img
            src={heroPreview}
            alt="hero"
            className="w-32 h-24 object-cover rounded mb-2"
          />
        )}
        <input
          type="file"
          accept="image/*"
          className="file-input file-input-bordered w-full"
          onChange={handleHeroUpload}
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Gallery Images</label>
        {form.existingGallery.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {form.existingGallery.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt={`gallery${i}`} className="w-16 h-12 object-cover rounded" />
                <button
                  type="button"
                  className="btn btn-xs btn-error absolute top-0 right-0"
                  onClick={() => removeExistingGallery(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          className="file-input file-input-bordered w-full mb-2"
          onChange={handleGalleryUpload}
        />
        <div className="flex gap-2 flex-wrap">
          {galleryPreview.map((url, i) => (
            <img key={i} src={url} alt={`new${i}`} className="w-16 h-12 object-cover rounded opacity-60" />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Status</label>
        <select
          className="select select-bordered w-full"
          value={form.status}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <button
        type="submit"
        className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
        disabled={loading}
      >
        Save Changes
      </button>
    </form>
  );
}

function ItineraryDay({ day, dIdx, onUpdate, onRemoveDay, onAddActivity, onRemoveActivity }) {
  const [actInput, setActInput] = useState("");
  return (
    <div className="border border-base-300 rounded p-3 mb-3 bg-base-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-sm">Day {day.day}</span>
        <input
          className="input input-bordered input-sm flex-1"
          placeholder="Day title"
          value={day.title}
          onChange={(e) => onUpdate(dIdx, "title", e.target.value)}
        />
        <button
          type="button"
          className="btn btn-xs btn-error"
          onClick={() => onRemoveDay(dIdx)}
        >
          Remove Day
        </button>
      </div>
      <ul className="list-disc ml-6 mb-2">
        {day.activities.map((act, aIdx) => (
          <li key={aIdx}>
            {act}{" "}
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={() => onRemoveActivity(dIdx, aIdx)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input input-bordered input-sm flex-1"
          placeholder="Add activity"
          value={actInput}
          onChange={(e) => setActInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddActivity(dIdx, actInput);
              setActInput("");
            }
          }}
        />
        <button
          type="button"
          className="btn btn-xs btn-accent"
          onClick={() => { onAddActivity(dIdx, actInput); setActInput(""); }}
        >
          Add Activity
        </button>
      </div>
    </div>
  );
}
