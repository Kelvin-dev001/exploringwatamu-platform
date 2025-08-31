import React, { useEffect, useState } from "react";

export default function BookTransfer() {
  const [transfers, setTransfers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState(null);
  const [vehicleImage, setVehicleImage] = useState("");

  const fetchTransfers = async (pg = 1, srch = "") => {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/transfers?search=${srch}&page=${pg}&limit=10`);
    const data = await res.json();
    setTransfers(data.data);
    setPage(data.page);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    fetchTransfers(page, search);
    // eslint-disable-next-line
  }, [page]);

  const handleSearch = e => {
    setSearch(e.target.value);
    fetchTransfers(1, e.target.value);
  };

  useEffect(() => {
    if (selectedRoute && selectedVehicleId) {
      const transfer = transfers.find(
        t => t.route === selectedRoute && t.vehicle._id === selectedVehicleId
      );
      if (transfer) {
        setPrice(transfer.price);
        setVehicleImage(transfer.vehicle.image);
      } else {
        setPrice(null);
        setVehicleImage("");
      }
    }
  }, [selectedRoute, selectedVehicleId, transfers]);

  const handleBookWhatsApp = () => {
    const vehicleName = transfers.find(t => t.vehicle._id === selectedVehicleId)?.vehicle.name || "";
    const message = `Hi, I want to book a transfer:\nRoute: ${selectedRoute}\nVehicle: ${vehicleName}\nDate: ${date}\nTime: ${time}\nPrice: $${price || "N/A"}`;
    window.open(`https://wa.me/2547xxxxxxx?text=${encodeURIComponent(message)}`);
  };

  const handleBookEmail = () => {
    const vehicleName = transfers.find(t => t.vehicle._id === selectedVehicleId)?.vehicle.name || "";
    const subject = "Transfer Booking";
    const body = `Hi, I want to book a transfer:\nRoute: ${selectedRoute}\nVehicle: ${vehicleName}\nDate: ${date}\nTime: ${time}\nPrice: $${price || "N/A"}`;
    window.location.href = `mailto:bookings@yourdomain.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Get routes/vehicles from available transfers for dropdowns
  const ROUTES = Array.from(new Set(transfers.map(t => t.route)));
  const VEHICLES = Array.from(new Map(
    transfers.map(t => [t.vehicle._id, t.vehicle])
  ).values());

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: "auto" }}>
      <h2>Book a Transfer</h2>
      <input type="text" placeholder="Search transfers..." value={search} onChange={handleSearch} style={{ width: "100%", marginBottom: 12 }} />
      <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select route</option>
        {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} required style={{ width: "100%", marginBottom: 12 }}>
        <option value="">Select vehicle</option>
        {VEHICLES.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
      </select>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={{ width: "100%", marginBottom: 12 }} />
      {vehicleImage && (
        <img src={vehicleImage} alt={VEHICLES.find(v => v._id === selectedVehicleId)?.name || ""} style={{ width: 120, height: 80, objectFit: "cover", marginBottom: 12 }} />
      )}
      {price !== null && <div style={{ marginBottom: 12 }}>Price: <b>${price}</b></div>}
      <button
        disabled={!selectedRoute || !selectedVehicleId || !date || !time}
        onClick={handleBookWhatsApp}
        style={{ marginRight: 8 }}
      >
        Book via WhatsApp
      </button>
      <button
        disabled={!selectedRoute || !selectedVehicleId || !date || !time}
        onClick={handleBookEmail}
      >
        Book via Email
      </button>
      <div style={{ marginTop: 16 }}>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span style={{ margin: "0 12px" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}