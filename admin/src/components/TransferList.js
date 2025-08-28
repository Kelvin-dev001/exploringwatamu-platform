import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

export default function TransferList() {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/transfers`)
      .then(res => setTransfers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-brand-teal p-4 rounded text-brand-cream">
      <h2 className="text-2xl mb-2">Transfers</h2>
      <ul>
        {transfers.map(transfer => (
          <li key={transfer._id} className="mb-4 p-2 bg-brand-cream text-brand-teal rounded">
            <strong>{transfer.route}</strong><br />
            Vehicle: {transfer.vehicleType}<br />
            Price: ${transfer.price}
          </li>
        ))}
      </ul>
    </div>
  );
}