import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ImageGallery from '../components/ImageGallery.jsx';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransfers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/transfers`);
        if (Array.isArray(res.data)) {
          setTransfers(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setTransfers(res.data.data);
        } else {
          setTransfers([]);
        }
      } catch (err) {
        setError('Failed to load transfers.');
      }
      setLoading(false);
    };
    fetchTransfers();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Transfers
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Airport & hotel transfers in Watamu.
      </p>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : transfers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {transfers.map((t) => {
            const vehicleImage = t.vehicle?.image ? [t.vehicle.image] : [];
            return (
              <div key={t._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <ImageGallery images={vehicleImage} alt={t.route} />
                <div className="p-5">
                  <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{t.route}</h3>
                  {t.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-3">{t.description}</p>
                  )}
                  {t.vehicle && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <span>🚗 {t.vehicle.name}</span>
                      {t.vehicle.capacity && <span>· {t.vehicle.capacity} seats</span>}
                    </div>
                  )}
                  {t.price != null && (
                    <p className="font-bold text-lg mt-2" style={{ color: '#ffb347' }}>
                      KES {Number(t.price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🚗</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No transfers available yet</h2>
          <p className="text-gray-500">Check back soon for airport and hotel transfer options.</p>
        </div>
      )}
    </div>
  );
}
