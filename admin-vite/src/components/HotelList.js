import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

export default function HotelList() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/hotels`)
      .then(res => setHotels(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-brand-teal p-4 rounded text-brand-cream">
      <h2 className="text-2xl mb-2">Hotels</h2>
      <ul>
        {hotels.map(hotel => (
          <li key={hotel._id} className="mb-4 p-2 bg-brand-cream text-brand-teal rounded">
            <strong>{hotel.name}</strong>
            <br />
            {hotel.description}
            <br />
            Price per night: ${hotel.pricePerNight}
          </li>
        ))}
      </ul>
    </div>
  );
}