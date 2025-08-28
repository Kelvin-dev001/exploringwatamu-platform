import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

export default function ServiceList() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/services`)
      .then(res => setServices(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-brand-teal p-4 rounded text-brand-cream">
      <h2 className="text-2xl mb-2">Customised Services</h2>
      <ul>
        {services.map(service => (
          <li key={service._id} className="mb-4 p-2 bg-brand-cream text-brand-teal rounded">
            <strong>{service.title}</strong><br />
            {service.description}<br />
            Price: ${service.price}
          </li>
        ))}
      </ul>
    </div>
  );
}