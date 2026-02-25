import React from 'react';

const STARS = [
  { key: 5, label: '5 Stars' },
  { key: 4, label: '4 Stars' },
  { key: 3, label: '3 Stars' },
  { key: null, label: 'All' },
];

export default function StarRatingTabs({ selectedStar, onSelect }) {
  return (
    <div className="flex justify-center gap-2 mb-6 flex-wrap">
      {STARS.map((star) => (
        <button
          key={star.key === null ? 'all' : star.key}
          onClick={() => onSelect(star.key)}
          className="px-4 py-2 rounded-full border font-medium text-sm transition-colors"
          style={{
            backgroundColor: selectedStar === star.key ? '#24b3b3' : '#fbeec1',
            color: selectedStar === star.key ? '#fff' : '#24b3b3',
            borderColor: '#24b3b3',
          }}
        >
          {star.label}
        </button>
      ))}
    </div>
  );
}