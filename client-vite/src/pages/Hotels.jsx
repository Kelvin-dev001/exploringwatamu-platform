import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import AccommodationTypeTabs from '../components/AccommodationTypeTabs.jsx';
import StarRatingTabs from '../components/StarRatingTabs.jsx';
import BookingButtons from '../components/BookingButtons.jsx';

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
        setAccommodations(res.data);
      } catch (err) {
        setError('Failed to load hotels.');
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary text-center mb-2">Accommodations</h1>
      <p className="text-primary-dark text-center mb-6">
        Find the perfect place to stay in Watamu.
      </p>

      <AccommodationTypeTabs selectedType={type} onSelect={setType} />
      <StarRatingTabs selectedStar={star} onSelect={setStar} />

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((acc) => (
            <div key={acc._id || acc.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {acc.images && acc.images[0] && (
                <img src={acc.images[0]} alt={acc.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold text-primary">{acc.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{acc.description}</p>
                <p className="text-secondary font-semibold mt-2">
                  {'★'.repeat(acc.stars || 0)} · {acc.type}
                </p>
                {(acc.whatsapp || acc.email) && (
                  <BookingButtons whatsapp={acc.whatsapp} email={acc.email} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">
          No accommodations found for your selection.
        </p>
      )}
    </div>
  );
}