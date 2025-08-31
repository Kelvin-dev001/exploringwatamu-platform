import React, { useEffect, useState } from "react";

export default function BookCarHire() {
  const [carHires, setCarHires] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({ vehicleType: "", minPrice: "", maxPrice: "", capacity: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedCarHireId, setSelectedCarHireId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [total, setTotal] = useState(null);

  // Fetch vehicle types for filter dropdown
  useEffect(() => {
    fetch(process.env.EXPO_PUBLIC_API_URL + "/vehicles")
      .then(res => res.json())
      .then(data => setVehicles(data));
  }, []);

  // Fetch car hire options with filters/pagination/availability
  const fetchCarHires = async () => {
    const params = new URLSearchParams({
      ...filters,
      page,
      limit: 10,
      startDate,
      endDate
    });
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/carhires?${params}`);
    const data = await res.json();
    setCarHires(data.data);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    fetchCarHires();
    // eslint-disable-next-line
  }, [filters, page, startDate, endDate]);

  useEffect(() => {
    if (selectedCarHireId && startDate && endDate) {
      const carHire = carHires.find(c => c._id === selectedCarHireId);
      if (carHire) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
        setTotal(days * carHire.dailyRate);
      } else {
        setTotal(null);
      }
    } else {
      setTotal(null);
    }
  }, [selectedCarHireId, startDate, endDate, carHires]);

  // Filters
  const handleFilterChange = (field, value) => setFilters({ ...filters, [field]: value });

  const handleBookWhatsApp = () => {
    const carHire = carHires.find(c => c._id === selectedCarHireId);
    if (!carHire) return;
    const message = `Hi, I want to hire a ${carHire.vehicle.name} from ${startDate} to ${endDate}.\nTotal: $${total}`;
    window.open(`https://wa.me/2547xxxxxxx?text=${encodeURIComponent(message)}`);
  };

  const handleBookEmail = () => {
    const carHire = carHires.find(c => c._id === selectedCarHireId);
    if (!carHire) return;
    const subject = "Car Hire Booking";
    const body = `Hi, I want to hire a ${carHire.vehicle.name} from ${startDate} to ${endDate}.\nTotal: $${total}`;
    window.location.href = `mailto:bookings@yourdomain.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "auto" }}>
      <h2>Hire a Car</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Vehicle Type: </label>
        <select value={filters.vehicleType} onChange={e => handleFilterChange("vehicleType", e.target.value)}>
          <option value="">All</option>
          {vehicles.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
        </select>
        <label style={{ marginLeft: 8 }}>Min Price:</label>
        <input type="number" value={filters.minPrice} onChange={e => handleFilterChange("minPrice", e.target.value)} style={{ width: 80 }} />
        <label style={{ marginLeft: 8 }}>Max Price:</label>
        <input type="number" value={filters.maxPrice} onChange={e => handleFilterChange("maxPrice", e.target.value)} style={{ width: 80 }} />
        <label style={{ marginLeft: 8 }}>Capacity:</label>
        <input type="number" value={filters.capacity} onChange={e => handleFilterChange("capacity", e.target.value)} style={{ width: 80 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ marginRight: 8 }} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        <button onClick={fetchCarHires} style={{ marginLeft: 8 }}>Check Availability</button>
      </div>

      <div>
        <table style={{ width: "100%", marginBottom: 16 }}>
          <thead>
            <tr>
              <th></th>
              <th>Vehicle</th>
              <th>Rate</th>
              <th>Capacity</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {carHires.map(c => (
              <tr key={c._id}>
                <td>
                  {c.vehicle?.image && <img src={c.vehicle.image} alt={c.vehicle.name} style={{ width: 64, height: 40, objectFit: "cover" }} />}
                </td>
                <td>{c.vehicle?.name}</td>
                <td>${c.dailyRate}/day</td>
                <td>{c.vehicle?.capacity || '-'}</td>
                <td>{c.description || '-'}</td>
                <td>
                  <button onClick={() => setSelectedCarHireId(c._id)}>Select</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span style={{ margin: "0 12px" }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {selectedCarHireId && (
        <div style={{ marginTop: 24 }}>
          <h3>Booking Details</h3>
          {carHires.find(c => c._id === selectedCarHireId)?.vehicle?.image && (
            <img
              src={carHires.find(c => c._id === selectedCarHireId)?.vehicle.image}
              alt={carHires.find(c => c._id === selectedCarHireId)?.vehicle.name}
              style={{ width: 120, height: 80, objectFit: "cover", marginBottom: 12 }}
            />
          )}
          <div>Vehicle: {carHires.find(c => c._id === selectedCarHireId)?.vehicle?.name}</div>
          <div>Dates: {startDate} to {endDate}</div>
          <div>Total: <b>${total || '--'}</b></div>
          <button disabled={!startDate || !endDate || !total} onClick={handleBookWhatsApp} style={{ marginRight: 8 }}>Book via WhatsApp</button>
          <button disabled={!startDate || !endDate || !total} onClick={handleBookEmail}>Book via Email</button>
        </div>
      )}
    </div>
  );
}