import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import BookingButtons from '../components/BookingButtons.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/services`);
        setServices(res.data);
      } catch (err) {
        setError('Failed to load services.');
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Services
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Local services in Watamu.
      </p>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : services.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {s.images && s.images[0] && (
                <img src={s.images[0]} alt={s.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{s.name}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">{s.description}</p>
                {s.price && (
                  <p className="font-semibold mt-2" style={{ color: '#ffb347' }}>From ${s.price}</p>
                )}
                {s.location && (
                  <p className="text-gray-500 text-xs mt-1">📍 {s.location}</p>
                )}
                {(s.whatsapp || s.email) && (
                  <BookingButtons whatsapp={s.whatsapp} email={s.email} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">No services available yet.</p>
      )}
    </div>
  );
}