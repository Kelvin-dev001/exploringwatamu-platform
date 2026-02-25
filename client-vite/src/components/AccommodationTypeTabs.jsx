import React from 'react';

const TYPES = [
  { key: 'hotel', label: 'Hotels' },
  { key: 'airbnb', label: 'Airbnbs' },
  { key: 'villa', label: 'Villas' },
];

export default function AccommodationTypeTabs({ selectedType, onSelect }) {
  return (
    <div className="flex justify-center gap-2 mb-4 flex-wrap">
      {TYPES.map((type) => (
        <button
          key={type.key}
          onClick={() => onSelect(type.key)}
          className="px-5 py-2 rounded-full border font-medium text-sm transition-colors"
          style={{
            backgroundColor: selectedType === type.key ? '#24b3b3' : 'rgba(36,179,179,0.1)',
            color: selectedType === type.key ? '#fff' : '#24b3b3',
            borderColor: '#24b3b3',
          }}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}