import React from 'react';

const TYPES = [
  { key: 'hotel', label: 'Hotels' },
  { key: 'airbnb', label: 'Airbnbs' },
  { key: 'villa', label: 'Villas' },
];

export default function AccommodationTypeTabs({ selectedType, onSelect }) {
  return (
    <div className="flex justify-center gap-2 mb-4">
      {TYPES.map((type) => (
        <button
          key={type.key}
          onClick={() => onSelect(type.key)}
          className={`px-5 py-2 rounded-full border font-medium text-sm transition-colors ${
            selectedType === type.key
              ? 'bg-primary text-white border-primary'
              : 'bg-primary/10 text-primary border-primary hover:bg-primary/20'
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}