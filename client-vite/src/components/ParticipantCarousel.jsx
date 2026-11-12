import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import { useI18n } from '@/i18n';
import messages from '@/locales/groupTrips';
import { useVibeWords } from '@/lib/travelVibes';

export default function ParticipantCarousel({ tripId }) {
  const { t, rich } = useI18n(messages);
  const { personaLabel, groupLabel } = useVibeWords();
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
        <span className="loading loading-spinner loading-sm" style={{ color: '#02a8ab' }}></span>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">{t('firstToJoin')}</p>
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

  const personalityText = participant.travelPersonalities?.map(personaLabel).join(' + ') || t('mystery');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: '#215a75' }}>
          {t('whosJoining', { count: participants.length })}
        </h3>
        {participants.length > 1 && (
          <span className="text-xs text-gray-500">
            {t('nOfTotal', { n: currentIndex + 1, total: participants.length })}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-4 shadow-md"
          style={{ backgroundColor: '#f9e9c4' }}
        >
          😊
        </div>

        {/* Name and vibe */}
        <h4 className="text-lg font-bold text-center" style={{ color: '#215a75' }}>
          {participant.user?.name || t('explorer')}
        </h4>
        <p className="text-sm text-gray-600 text-center mb-2">
          {personalityText}
        </p>

        {/* Travel group */}
        <p className="text-xs text-gray-500 text-center mb-3">
          {rich('travelingAs', { b: (text) => <span className="font-semibold">{text}</span> }, { group: groupLabel(participant.travelGroup) })}
        </p>

        {/* Joined X days ago */}
        <p className="text-xs text-gray-400 text-center">
          {daysAgo === 0 ? t('joinedToday') : t('joinedDaysAgo', { count: daysAgo })}
        </p>
      </div>

      {/* Carousel navigation */}
      {participants.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={prevParticipant}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
          >
            {t('prev')}
          </button>

          <div className="flex gap-1">
            {participants.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={t('showTraveller', { n: i + 1 })}
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
            {t('next')}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        {t('swipeMore')}
      </p>
    </div>
  );
}