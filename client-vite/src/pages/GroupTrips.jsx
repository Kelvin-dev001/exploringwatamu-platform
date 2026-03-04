import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api.js';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GroupTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/group-trips`)
      .then(res => {
        setTrips(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setError('Failed to load group trips.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg" style={{ color: '#24b3b3' }}></span>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-gray-500 py-24">{error}</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>Group Trips</h1>
      <p className="text-center mb-8" style={{ color: '#1e7575' }}>Join a scheduled group adventure in Watamu, Kenya 🇰🇪</p>

      {trips.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🏝️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No trips available yet</h2>
          <p className="text-gray-500">Check back soon — exciting group adventures are coming!</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {trips.map((trip) => {
            const slotsLeft = trip.slotsRemaining ?? (trip.maxParticipants - trip.confirmedParticipants);
            const isFull = trip.status === 'full' || slotsLeft <= 0;

            return (
              <div key={trip._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                {trip.heroImage ? (
                  <img src={trip.heroImage} alt={trip.title} className="w-full h-52 object-cover" />
                ) : (
                  <div className="w-full h-52 flex items-center justify-center" style={{ backgroundColor: '#24b3b3' }}>
                    <span className="text-5xl">🏖️</span>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold leading-tight" style={{ color: '#1e7575' }}>{trip.title}</h2>
                    {isFull ? (
                      <span className="badge badge-error badge-sm shrink-0 ml-2 mt-1">Full</span>
                    ) : slotsLeft <= 5 ? (
                      <span className="badge badge-warning badge-sm shrink-0 ml-2 mt-1">{slotsLeft} left!</span>
                    ) : (
                      <span className="badge badge-success badge-sm shrink-0 ml-2 mt-1">{slotsLeft} slots</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 flex-1">{trip.shortDescription}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>📅 {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-xs text-gray-400">From</p>
                      <p className="font-bold text-lg" style={{ color: '#ffb347' }}>KES {trip.depositAmount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">deposit · Full: KES {trip.fullPrice?.toLocaleString()}</p>
                    </div>
                    <Link
                      to={`/group-trips/${trip.slug}`}
                      className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: isFull ? '#9ca3af' : '#24b3b3' }}
                    >
                      {isFull ? 'View Trip' : 'View Trip →'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
