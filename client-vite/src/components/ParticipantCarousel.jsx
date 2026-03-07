import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';

export default function ParticipantCarousel({ tripId }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    axios.get(`${API_URL}/group-bookings/trip/${tripId}/participants`)
      .then(res => setParticipants(res.data))
      .catch(() => console.error('Failed to load participants'))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-sm" style={{ color: '#24b3b3' }}></span>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Be the first to join this adventure! 🚀</p>
      </div>
    );
  }

  const participant = participants[currentIndex];
  const daysAgo = Math.floor((Date.now() - new Date(participant.createdAt)) / (1000 * 60 * 60 * 24));

  const nextParticipant = () => {
    setCurrentIndex((prev) => (prev + 1) % participants.length);
  };

  const prevParticipant = () => {
    setCurrentIndex((prev) => (prev - 1 + participants.length) % participants.length);
  };

  const personalityText = participant.travelPersonalities?.join(' + ') || 'Mystery Traveler';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: '#1e7575' }}>
          👥 Who's Joining ({participants.length})
        </h3>
        {participants.length > 1 && (
          <span className="text-xs text-gray-500">
            {currentIndex + 1} of {participants.length}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-4 shadow-md"
          style={{ backgroundColor: '#fbeec1' }}
        >
          😊
        </div>

        {/* Name and vibe */}
        <h4 className="text-lg font-bold text-center" style={{ color: '#1e7575' }}>
          {participant.user?.name || 'Explorer'}
        </h4>
        <p className="text-sm text-gray-600 text-center mb-2">
          {personalityText}
        </p>

        {/* Travel group */}
        <p className="text-xs text-gray-500 text-center mb-3">
          Traveling as: <span className="font-semibold">{participant.travelGroup}</span>
        </p>

        {/* Joined X days ago */}
        <p className="text-xs text-gray-400 text-center">
          Joined {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}
        </p>
      </div>

      {/* Carousel navigation */}
      {participants.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={prevParticipant}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
          >
            ← Prev
          </button>

          <div className="flex gap-1">
            {participants.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-teal-500 w-6' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextParticipant}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
          >
            Next →
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        Swipe or click to see more adventurers →
      </p>
    </div>
  );
}