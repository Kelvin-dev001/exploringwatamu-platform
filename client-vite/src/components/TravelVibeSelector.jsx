import React, { useState } from 'react';

const PERSONALITIES = [
  { label: 'Party Starter', emoji: '🎉' },
  { label: 'Social Butterfly', emoji: '🦋' },
  { label: 'Chill Connector', emoji: '😎' },
  { label: 'Reserved Explorer', emoji: '🌿' },
  { label: 'Music Lover', emoji: '🎧' },
  { label: 'Storyteller', emoji: '📖' },
  { label: 'Jokester', emoji: '😂' },
  { label: 'Deep Talker', emoji: '🎙️' },
  { label: 'Adrenaline Junkie', emoji: '⚡' },
  { label: 'Photography Lover', emoji: '📸' },
  { label: 'Nature Nerd', emoji: '🌴' },
  { label: 'Foodie Explorer', emoji: '🍲' },
  { label: 'Beach Bum', emoji: '🏖️' },
];

const TRAVEL_GROUPS = [
  { label: 'Solo But Social', emoji: '👤' },
  { label: 'Couple Traveler', emoji: '💑' },
  { label: 'In a Friends Crew', emoji: '👥' },
  { label: 'Digital Nomad', emoji: '💻' },
];

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
      <h3 className="text-lg font-bold" style={{ color: '#1e7575' }}>
        Tell Us About Your Vibe
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose so we can customize your experience better! ✨
      </p>

      {step === 'personality' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            What energy you bring? (Select 1-3)
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
                  borderColor: selectedPersonalities.includes(p.label) ? '#24b3b3' : undefined,
                  backgroundColor: selectedPersonalities.includes(p.label) ? '#e0f7f6' : undefined,
                }}
              >
                <span className="mr-1">{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'group' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Who you with? (Pick one)
          </label>
          <div className="space-y-2">
            {TRAVEL_GROUPS.map((g) => (
              <label
                key={g.label}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50"
                style={{
                  borderColor: selectedGroup === g.label ? '#ffb347' : '#e5e7eb',
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
                <span className="font-medium text-sm">{g.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 'avatar' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Pick your avatar
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
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#fbeec1' }}>
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
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={
            (step === 'personality' && selectedPersonalities.length === 0) ||
            (step === 'group' && !selectedGroup)
          }
          className="ml-auto px-6 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#ffb347' }}
        >
          {step === 'avatar' ? 'Complete Profile →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}