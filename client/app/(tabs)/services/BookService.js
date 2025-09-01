import React, { useEffect, useState } from "react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function BookService() {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(1); // hours or days
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [available, setAvailable] = useState(true);
  const [userName, setUserName] = useState("");
  const [userContact, setUserContact] = useState("");

  useEffect(() => {
    fetch(process.env.EXPO_PUBLIC_API_URL + "/services")
      .then(res => res.json())
      .then(data => setServices(data.data || data));
  }, []);

  const selectedService = services.find(s => s._id === selectedServiceId);

  // Get time options from availableHours
  let timeOptions = [];
  if (selectedService && selectedService.availableHours?.start && selectedService.availableHours?.end) {
    let start = parseInt(selectedService.availableHours.start.split(":")[0], 10);
    let end = parseInt(selectedService.availableHours.end.split(":")[0], 10);
    for (let h = start; h <= end; h++) {
      timeOptions.push(`${h.toString().padStart(2, "0")}:00`);
    }
  }

  // Filter date based on availableDays
  const isDateAvailable = dateStr => {
    if (!selectedService || !selectedService.availableDays || !dateStr) return true;
    const jsDate = new Date(dateStr);
    const day = DAYS[jsDate.getDay() === 0 ? 6 : jsDate.getDay() - 1];
    return selectedService.availableDays.includes(day);
  };

  // Check availability whenever all fields are filled
  useEffect(() => {
    const checkAvailability = async () => {
      if (selectedServiceId && selectedDate && selectedTime && duration && isDateAvailable(selectedDate)) {
        try {
          const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/servicebookings/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              serviceId: selectedServiceId,
              date: selectedDate,
              time: selectedTime,
              duration
            })
          });
          const data = await res.json();
          setAvailable(data.available !== false);
        } catch (e) {
          setAvailable(true);
        }
      } else {
        setAvailable(true);
      }
    };
    checkAvailability();
  }, [selectedServiceId, selectedDate, selectedTime, duration]);

  let total = 0;
  if (selectedService) {
    total = duration * selectedService.price;
  }

  const handleBookWhatsApp = () => {
    if (!selectedService) return;
    const serviceName = selectedService.name;
    const message =
      `Hi, I want to book ${serviceName} on ${selectedDate} at ${selectedTime} for ${duration} ` +
      `${selectedService.pricingType}(s).\nTotal: $${total}\nName: ${userName}\nContact: ${userContact}`;
    window.open(`https://wa.me/2547xxxxxxx?text=${encodeURIComponent(message)}`);
  };

  const handleBookEmail = () => {
    if (!selectedService) return;
    const serviceName = selectedService.name;
    const subject = "Service Booking";
    const body =
      `Hi, I want to book ${serviceName} on ${selectedDate} at ${selectedTime} for ${duration} ` +
      `${selectedService.pricingType}(s).\nTotal: $${total}\nName: ${userName}\nContact: ${userContact}`;
    window.location.href = `mailto:bookings@yourdomain.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: "auto" }}>
      <h2>Book a Service</h2>
      <select
        value={selectedServiceId}
        onChange={e => setSelectedServiceId(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12 }}
      >
        <option value="">Select Service</option>
        {services.map(s => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>

      {selectedService && (
        <div style={{ marginBottom: 20 }}>
          <h3>{selectedService.name}</h3>
          <div>{selectedService.description}</div>
          <div><b>Pricing:</b> ${selectedService.price} / {selectedService.pricingType}</div>
          <div><b>Available Days:</b> {selectedService.availableDays.join(", ")}</div>
          <div><b>Available Hours:</b> {selectedService.availableHours?.start} - {selectedService.availableHours?.end}</div>
          <div>
            <b>Gallery:</b>
            {selectedService.gallery.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button onClick={() => setGalleryIdx(i => Math.max(i - 1, 0))} disabled={galleryIdx === 0}>Prev</button>
                <img
                  src={selectedService.gallery[galleryIdx]}
                  alt="Service"
                  style={{ width: 240, height: 160, objectFit: "cover", borderRadius: 8 }}
                />
                <button
                  onClick={() => setGalleryIdx(i => Math.min(i + 1, selectedService.gallery.length - 1))}
                  disabled={galleryIdx === selectedService.gallery.length - 1}
                >Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedService && (
        <>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12 }}
          />
          {!isDateAvailable(selectedDate) && (
            <div style={{ color: "red", marginBottom: 12 }}>
              Selected date is not available for this service.
            </div>
          )}
          <select
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12 }}
          >
            <option value="">Select Time</option>
            {timeOptions.map((t, i) => (
              <option key={i} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            style={{ width: "100%", marginBottom: 12 }}
            placeholder={`Number of ${selectedService.pricingType}s`}
            required
          />
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
            placeholder="Your Name"
            required
          />
          <input
            type="text"
            value={userContact}
            onChange={e => setUserContact(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
            placeholder="Your Contact (Phone/Email)"
            required
          />
          <div style={{ marginBottom: 12 }}>Total: <b>${total}</b></div>
          {!available && (
            <div style={{ color: "red", marginBottom: 12 }}>
              This slot is not available. Please select a different time/date.
            </div>
          )}
          <button
            disabled={
              !selectedServiceId ||
              !selectedDate ||
              !selectedTime ||
              !duration ||
              !userName ||
              !userContact ||
              !isDateAvailable(selectedDate) ||
              !available
            }
            onClick={handleBookWhatsApp}
            style={{ marginRight: 8 }}
          >
            Book via WhatsApp
          </button>
          <button
            disabled={
              !selectedServiceId ||
              !selectedDate ||
              !selectedTime ||
              !duration ||
              !userName ||
              !userContact ||
              !isDateAvailable(selectedDate) ||
              !available
            }
            onClick={handleBookEmail}
          >
            Book via Email
          </button>
        </>
      )}
    </div>
  );
}