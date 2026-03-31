import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ImageGallery from '../components/ImageGallery.jsx';

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/tours`);
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>Tours & Excursions</h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>Discover the best of Watamu.</p>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : tours.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {tours.map((tour) => (
            <div key={tour._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <ImageGallery images={tour.gallery} alt={tour.name} />
              <div className="p-5">
                <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{tour.name}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">{tour.description}</p>
                {tour.duration && (
                  <p className="text-gray-500 text-xs mt-2">⏱ {tour.duration}</p>
                )}
                {tour.recommendedTimes && (
                  <p className="text-gray-500 text-xs mt-1">🕐 Best time: {tour.recommendedTimes}</p>
                )}
                {/* Pricing grid */}
                {(tour.priceResidentAdult || tour.priceForeignerAdult) && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Resident</p>
                      {tour.priceResidentAdult != null && (
                        <p className="font-bold" style={{ color: '#ffb347' }}>
                          KES {Number(tour.priceResidentAdult).toLocaleString()} <span className="font-normal text-xs text-gray-400">adult</span>
                        </p>
                      )}
                      {tour.priceResidentChild != null && (
                        <p className="text-gray-600 text-xs">
                          KES {Number(tour.priceResidentChild).toLocaleString()} child
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Foreigner</p>
                      {tour.priceForeignerAdult != null && (
                        <p className="font-bold" style={{ color: '#ffb347' }}>
                          KES {Number(tour.priceForeignerAdult).toLocaleString()} <span className="font-normal text-xs text-gray-400">adult</span>
                        </p>
                      )}
                      {tour.priceForeignerChild != null && (
                        <p className="text-gray-600 text-xs">
                          KES {Number(tour.priceForeignerChild).toLocaleString()} child
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {tour.highlights && tour.highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {tour.highlights.slice(0, 4).map((h, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: '#24b3b3', color: '#24b3b3' }}>{h}</span>
                    ))}
                  </div>
                )}
                {tour.whatToCarry && tour.whatToCarry.length > 0 && (
                  <p className="text-gray-400 text-xs mt-2">
                    🎒 Bring: {tour.whatToCarry.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🗺️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No tours available yet</h2>
          <p className="text-gray-500">Check back soon for exciting tour packages.</p>
        </div>
      )}
    </div>
  );
}