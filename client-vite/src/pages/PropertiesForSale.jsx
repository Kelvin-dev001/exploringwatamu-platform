import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ImageGallery from '../components/ImageGallery.jsx';

const TYPE_LABELS = {
  villa: '🏡 Villa',
  apartment: '🏢 Apartment',
  land: '🌍 Land',
};

export default function PropertiesForSale() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/properties`);
        if (Array.isArray(res.data)) {
          setProperties(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setProperties(res.data.data);
        } else {
          setProperties([]);
        }
      } catch (err) {
        setError('Failed to load properties.');
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const filtered = typeFilter
    ? properties.filter((p) => p.type === typeFilter)
    : properties;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Properties For Sale
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Find your dream property in Watamu.
      </p>

      {/* Type filter tabs */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {[null, 'villa', 'apartment', 'land'].map((t) => (
          <button
            key={t || 'all'}
            onClick={() => setTypeFilter(t)}
            className="px-5 py-2 rounded-full border font-medium text-sm transition-colors"
            style={{
              backgroundColor: typeFilter === t ? '#24b3b3' : 'rgba(36,179,179,0.1)',
              color: typeFilter === t ? '#fff' : '#24b3b3',
              borderColor: '#24b3b3',
            }}
          >
            {t ? TYPE_LABELS[t] : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <ImageGallery images={p.pictures} alt={p.name} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{p.name}</h3>
                  {p.type && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#24b3b3', color: '#fff' }}>
                      {p.type}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">{p.description}</p>
                {p.location && (
                  <p className="text-gray-500 text-xs mt-2">📍 {p.location}</p>
                )}
                {p.price != null && (
                  <p className="font-bold text-lg mt-2" style={{ color: '#ffb347' }}>
                    KES {Number(p.price).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🏡</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No properties available yet</h2>
          <p className="text-gray-500">Check back soon for property listings.</p>
        </div>
      )}
    </div>
  );
}