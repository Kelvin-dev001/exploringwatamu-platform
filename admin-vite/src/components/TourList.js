import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

export default function TourList() {
  const [tours, setTours] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/tours`)
      .then(res => setTours(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-brand-teal p-4 rounded text-brand-cream">
      <h2 className="text-2xl mb-2">Tours</h2>
      <ul>
        {tours.map(tour => (
          <li key={tour._id} className="mb-4 p-2 bg-brand-cream text-brand-teal rounded">
            <strong>{tour.title}</strong><br />
            {tour.description}<br />
            Resident Price: ${tour.residentPrice}<br />
            Non-Resident Price: ${tour.nonResidentPrice}<br />
            Available Dates: {tour.dates && tour.dates.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}