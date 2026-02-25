import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import BookingButtons from '../components/BookingButtons.jsx';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransfers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/transfers`);
        setTransfers(res.data);
      } catch (err) {
        setError('Failed to load transfers.');
      }
      setLoading(false);
    };
    fetchTransfers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary text-center mb-2">Transfers</h1>
      <p className="text-primary-dark text-center mb-6">Airport & hotel transfers in Watamu.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : transfers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {transfers.map((t) => (
            <div key={t._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {t.images && t.images[0] && (
                <img src={t.images[0]} alt={t.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold text-primary">{t.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{t.description}</p>
                {t.price && <p className="text-secondary font-semibold mt-2">From ${t.price}</p>}
                {(t.whatsapp || t.email) && (
                  <BookingButtons whatsapp={t.whatsapp} email={t.email} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">No transfers available yet.</p>
      )}
    </div>
  );
}