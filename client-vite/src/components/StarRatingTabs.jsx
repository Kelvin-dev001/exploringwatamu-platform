import React from 'react';

const STARS = [
  { key: 5, label: '5 Stars' },
  { key: 4, label: '4 Stars' },
  { key: 3, label: '3 Stars' },
  { key: null, label: 'All' },
];

export default function StarRatingTabs({ selectedStar, onSelect }) {
  return (
    <div className="flex justify-center gap-2 mb-6">
      {STARS.map((star) => (
        <button
          key={star.key === null ? 'all' : star.key}
          onClick={() => onSelect(star.key)}
          className={`px-4 py-2 rounded-full border font-medium text-sm transition-colors ${
            selectedStar === star.key
              ? 'bg-primary text-white border-primary'
              : 'bg-cream text-primary border-primary hover:bg-primary/10'
          }`}
        >
          {star.label}
        </button>
      ))}
    </div>
  );
}