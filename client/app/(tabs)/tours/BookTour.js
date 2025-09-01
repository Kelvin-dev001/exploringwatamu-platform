import React, { useEffect, useState } from "react";

export default function BookTour() {
  const [tours, setTours] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedTourId, setSelectedTourId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [tourDate, setTourDate] = useState("");
  const [paxAdults, setPaxAdults] = useState(1);
  const [paxChildren, setPaxChildren] = useState(0);
  const [isResident, setIsResident] = useState(true);

  // UI for gallery preview
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    fetch(process.env.EXPO_PUBLIC_API_URL + "/tours")
      .then(res => res.json())
      .then(data => setTours(data));
    fetch(process.env.EXPO_PUBLIC_API_URL + "/vehicles")
      .then(res => res.json())
      .then(data => setVehicles(data));
  }, []);

  const selectedTour = tours.find(t => t._id === selectedTourId);
  const applicableVehicles = selectedTour?.vehicles || [];

  // Price calculation
  let total = 0;
  if (selectedTour) {
    if (isResident) {
      total = (paxAdults * selectedTour.priceResidentAdult) + (paxChildren * selectedTour.priceResidentChild);
    } else {
      total = (paxAdults * selectedTour.priceForeignerAdult) + (paxChildren * selectedTour.priceForeignerChild);
    }
  }

  // Booking actions
  const handleBookWhatsApp = () => {
    if (!selectedTour) return;
    const tourName = selectedTour.name;
    const vehicleName = vehicles.find(v => v._id === selectedVehicleId)?.name || "";
    const message = `Hi, I'd like to book the ${tourName} on ${tourDate}.\nVehicle: ${vehicleName}\nPax: ${paxAdults} adults, ${paxChildren} children\nResidency: ${isResident ? "Resident" : "Foreigner"}\nTotal: $${total}`;
    window.open(`https://wa.me/2547xxxxxxx?text=${encodeURIComponent(message)}`);
  };

  const handleBookEmail = () => {
    if (!selectedTour) return;
    const tourName = selectedTour.name;
    const vehicleName = vehicles.find(v => v._id === selectedVehicleId)?.name || "";
    const subject = "Tour Booking";
    const body = `Hi, I'd like to book the ${tourName} on ${tourDate}.\nVehicle: ${vehicleName}\nPax: ${paxAdults} adults, ${paxChildren} children\nResidency: ${isResident ? "Resident" : "Foreigner"}\nTotal: $${total}`;
    window.location.href = `mailto:bookings@yourdomain.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: "auto" }}>
      <h2>Book a Tour</h2>
      <select value={selectedTourId} onChange={e => setSelectedTourId(e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select Tour</option>
        {tours.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </select>
      {selectedTour && (
        <div style={{ marginBottom: 20 }}>
          <h3>{selectedTour.name}</h3>
          <div>{selectedTour.description}</div>
          <div><b>Recommended Times:</b> {selectedTour.recommendedTimes}</div>
          <div><b>Duration:</b> {selectedTour.duration}</div>
          <div><b>Highlights:</b>
            <ul>{selectedTour.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </div>
          <div><b>What to Carry:</b>
            <ul>{selectedTour.whatToCarry.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
          <div>
            <b>Gallery:</b>
            {selectedTour.gallery.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setGalleryIdx(i => Math.max(i - 1, 0))} disabled={galleryIdx === 0}>Prev</button>
                <img src={selectedTour.gallery[galleryIdx]} alt="Tour" style={{ width: 240, height: 160, objectFit: "cover", borderRadius: 8 }} />
                <button onClick={() => setGalleryIdx(i => Math.min(i + 1, selectedTour.gallery.length - 1))} disabled={galleryIdx === selectedTour.gallery.length - 1}>Next</button>
              </div>
            )}
          </div>
        </div>
      )}
      {applicableVehicles.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label>Vehicle:</label>
          <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} style={{ width: "100%", marginBottom: 12 }}>
            <option value="">Select vehicle</option>
            {vehicles.filter(v => applicableVehicles.includes(v._id)).map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}
      <input type="date" value={tourDate} onChange={e => setTourDate(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        <label>Adults:</label>
        <input type="number" min={1} value={paxAdults} onChange={e => setPaxAdults(Number(e.target.value))} style={{ width: 60 }} />
        <label style={{ marginLeft: 12 }}>Children:</label>
        <input type="number" min={0} value={paxChildren} onChange={e => setPaxChildren(Number(e.target.value))} style={{ width: 60 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          <input type="radio" checked={isResident} onChange={() => setIsResident(true)} /> Resident
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" checked={!isResident} onChange={() => setIsResident(false)} /> Foreigner
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>Total: <b>${total}</b></div>
      <button
        disabled={!selectedTourId || !tourDate || (applicableVehicles.length > 0 && !selectedVehicleId)}
        onClick={handleBookWhatsApp}
        style={{ marginRight: 8 }}
      >
        Book via WhatsApp
      </button>
      <button
        disabled={!selectedTourId || !tourDate || (applicableVehicles.length > 0 && !selectedVehicleId)}
        onClick={handleBookEmail}
      >
        Book via Email
      </button>
    </div>
  );
}