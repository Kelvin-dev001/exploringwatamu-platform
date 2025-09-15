import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

export default function CarHireList() {
  const [carHires, setCarHires] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/carhire`)
      .then(res => setCarHires(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-brand-teal p-4 rounded text-brand-cream">
      <h2 className="text-2xl mb-2">Car Hire</h2>
      <ul>
        {carHires.map(car => (
          <li key={car._id} className="mb-4 p-2 bg-brand-cream text-brand-teal rounded">
            <strong>{car.vehicleType}</strong><br />
            {car.description}<br />
            Price per day: ${car.pricePerDay}
          </li>
        ))}
      </ul>
    </div>
  );
}