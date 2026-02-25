import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import BookingButtons from '../components/BookingButtons.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function PropertiesForSale() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/properties`);
        setProperties(res.data);
      } catch (err) {
        setError('Failed to load properties.');
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Properties For Sale
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Find your dream property in Watamu.
      </p>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : properties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {properties.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {p.images && p.images[0] && (
                <img src={p.images[0]} alt={p.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{p.name}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">{p.description}</p>
                {p.price && (
                  <p className="font-semibold mt-2" style={{ color: '#ffb347' }}>
                    KES {Number(p.price).toLocaleString()}
                  </p>
                )}
                {p.location && (
                  <p className="text-gray-500 text-xs mt-1">📍 {p.location}</p>
                )}
                {p.bedrooms && (
                  <p className="text-gray-500 text-xs">🛏 {p.bedrooms} bedrooms</p>
                )}
                {(p.whatsapp || p.email) && (
                  <BookingButtons whatsapp={p.whatsapp} email={p.email} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">No properties available yet.</p>
      )}
    </div>
  );
}