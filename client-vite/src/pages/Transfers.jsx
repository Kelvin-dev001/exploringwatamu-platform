import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import BookingButtons from '../components/BookingButtons.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

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
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Transfers
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Airport & hotel transfers in Watamu.
      </p>

      {loading ? (
        <LoadingSpinner loading={true} />
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
                <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{t.name}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">{t.description}</p>
                {t.price && (
                  <p className="font-semibold mt-2" style={{ color: '#ffb347' }}>From ${t.price}</p>
                )}
                {t.location && (
                  <p className="text-gray-500 text-xs mt-1">📍 {t.location}</p>
                )}
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