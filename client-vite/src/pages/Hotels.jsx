import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import AccommodationTypeTabs from '../components/AccommodationTypeTabs.jsx';
import StarRatingTabs from '../components/StarRatingTabs.jsx';
import BookingButtons from '../components/BookingButtons.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ImageGallery from '../components/ImageGallery.jsx';

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

  const getLocationText = (location) => {
    if (!location) return null;
    if (typeof location === 'string') return location;
    if (location.address) return location.address;
    return null;
  };

  const getWhatsapp = (acc) => acc.whatsapp || acc.contact?.whatsapp || null;
  const getEmail = (acc) => acc.email || acc.contact?.email || null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
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
        <div className="text-center py-16">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((acc) => {
            const locationText = getLocationText(acc.location);
            const whatsapp = getWhatsapp(acc);
            const email = getEmail(acc);

            return (
              <div key={acc._id || acc.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <ImageGallery images={acc.images} alt={acc.name} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{acc.name}</h3>
                    {acc.stars > 0 && (
                      <span className="text-sm shrink-0 ml-2" style={{ color: '#ffb347' }}>
                        {'★'.repeat(acc.stars)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-3">{acc.description}</p>
                  {locationText && (
                    <p className="text-gray-500 text-xs mt-2">📍 {locationText}</p>
                  )}
                  {acc.location?.mapUrl && (
                    <a
                      href={acc.location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline mt-0.5 inline-block"
                      style={{ color: '#24b3b3' }}
                    >
                      View on map ↗
                    </a>
                  )}
                  {acc.pricePerNight != null && (
                    <p className="font-bold text-lg mt-2" style={{ color: '#ffb347' }}>
                      KES {Number(acc.pricePerNight).toLocaleString()} <span className="text-xs font-normal text-gray-400">/ night</span>
                    </p>
                  )}
                  {/* Facilities */}
                  {acc.facilities && acc.facilities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {acc.facilities.slice(0, 5).map((f, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{f}</span>
                      ))}
                      {acc.facilities.length > 5 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">+{acc.facilities.length - 5}</span>
                      )}
                    </div>
                  )}
                  {/* Room Types summary */}
                  {acc.roomTypes && acc.roomTypes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1">Room types:</p>
                      <div className="flex flex-wrap gap-1">
                        {acc.roomTypes.slice(0, 3).map((rt, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: '#24b3b3', color: '#24b3b3' }}>
                            {rt.name}{rt.price ? ` · KES ${Number(rt.price).toLocaleString()}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* House rules */}
                  {acc.houseRules && acc.houseRules.length > 0 && (
                    <p className="text-gray-400 text-xs mt-2">
                      📋 {acc.houseRules.length} house rule{acc.houseRules.length > 1 ? 's' : ''}
                    </p>
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
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🏨</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No accommodations found</h2>
          <p className="text-gray-500">Try adjusting your filters to see more results.</p>
        </div>
      )}
    </div>
  );
}