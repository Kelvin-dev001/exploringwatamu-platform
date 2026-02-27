import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import AccommodationTypeTabs from '../components/AccommodationTypeTabs.jsx';
import StarRatingTabs from '../components/StarRatingTabs.jsx';
import BookingButtons from '../components/BookingButtons.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function Hotels() {
  const [accommodations, setAccommodations] = useState([]);
  const [type, setType] = useState('hotel');
  const [star, setStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_URL}/hotels`);
        setAccommodations(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError('Failed to load accommodations.');
        setAccommodations([]);
      }
      setLoading(false);
    };
    fetchHotels();
  }, []);

  const filtered = accommodations.filter((acc) => {
    const matchesType = acc.type === type;
    const matchesStar = star ? acc.stars === star : true;
    return matchesType && matchesStar;
  });

  // Safely extract string values from potentially nested objects
  const getLocationText = (location) => {
    if (!location) return null;
    if (typeof location === 'string') return location;
    if (location.address) return location.address;
    return null;
  };

  const getWhatsapp = (acc) => acc.whatsapp || acc.contact?.whatsapp || null;
  const getEmail = (acc) => acc.email || acc.contact?.email || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Accommodations
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Find the perfect place to stay in Watamu.
      </p>

      <AccommodationTypeTabs selectedType={type} onSelect={setType} />
      <StarRatingTabs selectedStar={star} onSelect={setStar} />

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((acc) => {
            const locationText = getLocationText(acc.location);
            const whatsapp = getWhatsapp(acc);
            const email = getEmail(acc);

            return (
              <div key={acc._id || acc.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {acc.images && acc.images[0] && (
                  <img src={acc.images[0]} alt={acc.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{acc.name}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-3">{acc.description}</p>
                  <p className="font-semibold mt-2" style={{ color: '#ffb347' }}>
                    {'★'.repeat(acc.stars || 0)} · {acc.type}
                  </p>
                  {locationText && (
                    <p className="text-gray-500 text-xs mt-1">📍 {locationText}</p>
                  )}
                  {(whatsapp || email) && (
                    <BookingButtons whatsapp={whatsapp} email={email} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">
          No accommodations found for your selection.
        </p>
      )}
    </div>
  );
}