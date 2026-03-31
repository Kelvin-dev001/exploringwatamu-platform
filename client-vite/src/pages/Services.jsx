import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ImageGallery from '../components/ImageGallery.jsx';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/services`);
        if (Array.isArray(res.data)) {
          setServices(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setServices(res.data.data);
        } else {
          setServices([]);
        }
      } catch (err) {
        setError('Failed to load services.');
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Services
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Local services in Watamu.
      </p>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : services.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <div key={s._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <ImageGallery images={s.gallery} alt={s.name} />
              <div className="p-5">
                <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{s.name}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">{s.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  {s.price != null && (
                    <span className="font-bold text-lg" style={{ color: '#ffb347' }}>
                      KES {Number(s.price).toLocaleString()}
                    </span>
                  )}
                  {s.pricingType && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {s.pricingType}
                    </span>
                  )}
                </div>
                {s.availableDays && s.availableDays.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.availableDays.map((day, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: '#24b3b3', color: '#24b3b3' }}>
                        {day}
                      </span>
                    ))}
                  </div>
                )}
                {s.availableHours && (s.availableHours.start || s.availableHours.end) && (
                  <p className="text-gray-500 text-xs mt-1">
                    🕐 {s.availableHours.start} – {s.availableHours.end}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">⭐</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No services available yet</h2>
          <p className="text-gray-500">Check back soon for local service offerings.</p>
        </div>
      )}
    </div>
  );
}