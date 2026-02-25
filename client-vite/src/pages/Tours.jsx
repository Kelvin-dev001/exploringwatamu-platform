import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import BookingButtons from '../components/BookingButtons.jsx';

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/tours`);
        setTours(res.data);
      } catch (err) {
        setError('Failed to load tours.');
      }
      setLoading(false);
    };
    fetchTours();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary text-center mb-2">Tours & Excursions</h1>
      <p className="text-primary-dark text-center mb-6">Discover the best of Watamu.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : tours.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {tours.map((tour) => (
            <div key={tour._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {tour.images && tour.images[0] && (
                <img src={tour.images[0]} alt={tour.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold text-primary">{tour.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{tour.description}</p>
                {tour.price && (
                  <p className="text-secondary font-semibold mt-2">From ${tour.price}</p>
                )}
                {(tour.whatsapp || tour.email) && (
                  <BookingButtons whatsapp={tour.whatsapp} email={tour.email} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">No tours available yet.</p>
      )}
    </div>
  );
}