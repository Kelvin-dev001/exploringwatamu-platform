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
        // Backend returns { data: [...], page, totalPages, total }
        // Handle both paginated and raw array responses
        if (Array.isArray(res.data)) {
          setTours(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setTours(res.data.data);
        } else {
          setTours([]);
        }
      } catch (err) {
        setError('Failed to load tours.');
      }
      setLoading(false);
    };
    fetchTours();
  }, []);

  // Helper: safely get contact info
  const getWhatsapp = (item) => item.whatsapp || item.contact?.whatsapp || null;
  const getEmail = (item) => item.email || item.contact?.email || null;
  const getLocation = (item) => {
    if (!item.location) return null;
    if (typeof item.location === 'string') return item.location;
    if (item.location.address) return item.location.address;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>Tours & Excursions</h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>Discover the best of Watamu.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" style={{ color: '#24b3b3' }}></span>
        </div>
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : tours.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {tours.map((tour) => {
            const whatsapp = getWhatsapp(tour);
            const email = getEmail(tour);
            const locationText = getLocation(tour);

            return (
              <div key={tour._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {tour.gallery && tour.gallery[0] && (
                  <img src={tour.gallery[0]} alt={tour.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{tour.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{tour.description}</p>
                  {tour.duration && (
                    <p className="text-gray-500 text-xs mt-1">⏱ {tour.duration}</p>
                  )}
                  {tour.priceResidentAdult && (
                    <p className="font-semibold mt-2" style={{ color: '#ffb347' }}>
                      From ${tour.priceResidentAdult} (resident) / ${tour.priceForeignerAdult} (foreigner)
                    </p>
                  )}
                  {locationText && (
                    <p className="text-gray-500 text-xs mt-1">📍 {locationText}</p>
                  )}
                  {tour.highlights && tour.highlights.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tour.highlights.slice(0, 3).map((h, i) => (
                        <span key={i} className="badge badge-sm badge-outline" style={{ borderColor: '#24b3b3', color: '#24b3b3' }}>{h}</span>
                      ))}
                    </div>
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
        <p className="text-center text-gray-500 py-16">No tours available yet.</p>
      )}
    </div>
  );
}