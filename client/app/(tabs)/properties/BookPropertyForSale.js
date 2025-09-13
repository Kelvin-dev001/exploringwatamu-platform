import React, { useEffect, useState } from "react";

export default function BookPropertyForSale() {
  const [properties, setProperties] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [userName, setUserName] = useState("");
  const [userContact, setUserContact] = useState("");
  const [available, setAvailable] = useState(true);
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    fetch(process.env.EXPO_PUBLIC_API_URL + "/properties")
      .then(res => res.json())
      .then(data => setProperties(data.data || data));
  }, []);

  // Filter by type
  const filteredProperties = selectedType
    ? properties.filter(p => p.type === selectedType)
    : properties;

  const selectedProperty = filteredProperties.find(p => p._id === selectedPropertyId);

  // Check slot availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedPropertyId || !selectedDate || !selectedTime) {
        setAvailable(true);
        return;
      }
      try {
        const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/propertyviewings/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: selectedPropertyId,
            date: selectedDate,
            time: selectedTime
          })
        });
        const data = await res.json();
        setAvailable(data.available !== false);
      } catch (e) {
        setAvailable(true);
      }
    };
    checkAvailability();
  }, [selectedPropertyId, selectedDate, selectedTime]);

  const handleBookWhatsApp = () => {
    if (!selectedProperty) return;
    const message =
      `Hi, I'd like to book a viewing for ${selectedProperty.name} (${selectedProperty.type}) located at ${selectedProperty.location}.\n` +
      `Date: ${selectedDate}\nTime: ${selectedTime}\nName: ${userName}\nContact: ${userContact}\nPrice: $${selectedProperty.price}`;
    window.open(`https://wa.me/2547xxxxxxx?text=${encodeURIComponent(message)}`);
  };

  const handleBookEmail = () => {
    if (!selectedProperty) return;
    const subject = "Property Viewing Booking";
    const body =
      `Hi, I'd like to book a viewing for ${selectedProperty.name} (${selectedProperty.type}) located at ${selectedProperty.location}.\n` +
      `Date: ${selectedDate}\nTime: ${selectedTime}\nName: ${userName}\nContact: ${userContact}\nPrice: $${selectedProperty.price}`;
    window.location.href = `mailto:bookings@yourdomain.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // API booking (optional: can be used for direct booking)
  const handleDirectBooking = async () => {
    if (!selectedPropertyId || !selectedDate || !selectedTime || !userName || !userContact || !available) return;
    try {
      const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/propertyviewings/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          date: selectedDate,
          time: selectedTime,
          userName,
          userContact
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBookingMessage("Your viewing has been booked successfully!");
      } else {
        setBookingMessage(data.error || "Booking failed.");
      }
    } catch (err) {
      setBookingMessage("Booking failed. Please try again.");
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: "auto" }}>
      <h2>Book Property Viewing</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={{ background: selectedType === "" ? "#222" : "#eee", color: selectedType === "" ? "#fff" : "#222" }} onClick={() => setSelectedType("")}>All</button>
        <button style={{ background: selectedType === "villa" ? "#222" : "#eee", color: selectedType === "villa" ? "#fff" : "#222" }} onClick={() => setSelectedType("villa")}>Villa</button>
        <button style={{ background: selectedType === "apartment" ? "#222" : "#eee", color: selectedType === "apartment" ? "#fff" : "#222" }} onClick={() => setSelectedType("apartment")}>Apartment</button>
        <button style={{ background: selectedType === "land" ? "#222" : "#eee", color: selectedType === "land" ? "#fff" : "#222" }} onClick={() => setSelectedType("land")}>Land</button>
      </div>
      <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select Property</option>
        {filteredProperties.map(p => <option key={p._id} value={p._id}>{p.name} ({p.location})</option>)}
      </select>
      {selectedProperty && (
        <div style={{ marginBottom: 20 }}>
          <h3>{selectedProperty.name} <span style={{ fontWeight: "normal" }}>({selectedProperty.type})</span></h3>
          <div>{selectedProperty.description}</div>
          <div><b>Location:</b> {selectedProperty.location}</div>
          <div><b>Price:</b> ${selectedProperty.price}</div>
          <div>
            <b>Pictures:</b>
            {selectedProperty.pictures.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setGalleryIdx(i => Math.max(i - 1, 0))} disabled={galleryIdx === 0}>Prev</button>
                <img src={selectedProperty.pictures[galleryIdx]} alt="Property" style={{ width: 240, height: 160, objectFit: "cover", borderRadius: 8 }} />
                <button onClick={() => setGalleryIdx(i => Math.min(i + 1, selectedProperty.pictures.length - 1))} disabled={galleryIdx === selectedProperty.pictures.length - 1}>Next</button>
              </div>
            )}
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Documents:</b>
            {selectedProperty.documents.length > 0 ? (
              <ul>
                {selectedProperty.documents.map((docUrl, i) => (
                  <li key={i}><a href={docUrl} target="_blank" rel="noopener noreferrer">Document {i + 1}</a></li>
                ))}
              </ul>
            ) : (
              <span>No documents uploaded.</span>
            )}
          </div>
        </div>
      )}
      {selectedProperty && (
        <>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
          <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
          <input type="text" value={userName} onChange={e => setUserName(e.target.value)} style={{ width: "100%", marginBottom: 12 }} placeholder="Your Name" required />
          <input type="text" value={userContact} onChange={e => setUserContact(e.target.value)} style={{ width: "100%", marginBottom: 12 }} placeholder="Your Contact (Phone/Email)" required />
          {!available && (
            <div style={{ color: "red", marginBottom: 12 }}>
              This slot is not available. Please select a different time/date.
            </div>
          )}
          <button
            disabled={!selectedPropertyId || !selectedDate || !selectedTime || !userName || !userContact || !available}
            onClick={handleBookWhatsApp}
            style={{ marginRight: 8 }}
          >
            Book via WhatsApp
          </button>
          <button
            disabled={!selectedPropertyId || !selectedDate || !selectedTime || !userName || !userContact || !available}
            onClick={handleBookEmail}
            style={{ marginRight: 8 }}
          >
            Book via Email
          </button>
          <button
            type="button"
            disabled={!selectedPropertyId || !selectedDate || !selectedTime || !userName || !userContact || !available}
            onClick={handleDirectBooking}
          >
            Book Directly
          </button>
          {bookingMessage && (
            <div style={{ color: bookingMessage.startsWith("Your") ? "green" : "red", marginTop: 12 }}>
              {bookingMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
}