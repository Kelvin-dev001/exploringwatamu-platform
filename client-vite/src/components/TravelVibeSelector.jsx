import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import messages from '@/locales/groupTrips';
import { PERSONALITIES, TRAVEL_GROUPS, useVibeWords } from '@/lib/travelVibes';

const AVATARS = [
  'avatar_1.png',
  'avatar_2.png',
  'avatar_3.png',
  'avatar_4.png',
  'avatar_5.png',
  'avatar_6.png',
  'avatar_7.png',
  'avatar_8.png',
];

export default function TravelVibeSelector({ onComplete }) {
  const { t } = useI18n(messages);
  const { personaLabel, groupLabel } = useVibeWords();
  const [selectedPersonalities, setSelectedPersonalities] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1.png');
  const [step, setStep] = useState('personality'); // 'personality' | 'group' | 'avatar' | 'complete'

  const togglePersonality = (label) => {
    if (selectedPersonalities.includes(label)) {
      setSelectedPersonalities(selectedPersonalities.filter(p => p !== label));
    } else if (selectedPersonalities.length < 3) {
      setSelectedPersonalities([...selectedPersonalities, label]);
    }
  };

  const handleNext = () => {
    if (step === 'personality' && selectedPersonalities.length > 0) {
      setStep('group');
    } else if (step === 'group' && selectedGroup) {
      setStep('avatar');
    } else if (step === 'avatar') {
      onComplete({
        travelPersonalities: selectedPersonalities,
        travelGroup: selectedGroup,
        selectedAvatar,
      });
    }
  };

  const handleBack = () => {
    if (step === 'group') setStep('personality');
    else if (step === 'avatar') setStep('group');
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold" style={{ color: '#215a75' }}>
        {t('vibeTitle')}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {t('vibeIntro')}
      </p>

      {step === 'personality' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t('vibeEnergy')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PERSONALITIES.map((p) => (
              <button
                key={p.label}
                onClick={() => togglePersonality(p.label)}
                className={`p-3 rounded-lg text-sm font-medium transition-all border ${ selectedPersonalities.includes(p.label)
                  ? 'border-2 bg-teal-50'
                  : 'border border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderColor: selectedPersonalities.includes(p.label) ? '#02a8ab' : undefined,
                  backgroundColor: selectedPersonalities.includes(p.label) ? '#e0f7f6' : undefined,
                }}
              >
                <span className="mr-1">{p.emoji}</span> {personaLabel(p.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'group' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t('vibeWho')}
          </label>
          <div className="space-y-2">
            {TRAVEL_GROUPS.map((g) => (
              <label
                key={g.label}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50"
                style={{
                  borderColor: selectedGroup === g.label ? '#e06c31' : '#e5e7eb',
                  backgroundColor: selectedGroup === g.label ? '#fff8f0' : undefined,
                }}
              >
                <input
                  type="radio"
                  name="travelGroup"
                  value={g.label}
                  checked={selectedGroup === g.label}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="radio radio-sm"
                />
                <span className="text-xl">{g.emoji}</span>
                <span className="font-medium text-sm">{groupLabel(g.label)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 'avatar' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t('vibeAvatar')}
          </label>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`p-3 rounded-lg border-2 transition-all ${ selectedAvatar === avatar
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#f9e9c4' }}>
                  <span className="text-2xl">😊</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-between pt-4">
        {step !== 'personality' && (
          <button
            onClick={handleBack}
            className="px-4 py-2.5 rounded-lg font-semibold border border-gray-300 text-gray-700 text-sm"
          >
            {t('back')}
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={
            (step === 'personality' && selectedPersonalities.length === 0) ||
            (step === 'group' && !selectedGroup)
          }
          className="ml-auto px-6 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#e06c31' }}
        >
          {step === 'avatar' ? t('vibeComplete') : t('vibeNext')}
        </button>
      </div>
    </div>
  );
}
