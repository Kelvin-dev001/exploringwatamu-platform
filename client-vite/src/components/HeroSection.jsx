import React from 'react';

export default function HeroSection() {
  return (
    <div className="flex flex-col items-center py-8">
      <div
        className="w-36 h-36 rounded-full flex items-center justify-center shadow-xl mb-6"
        style={{ backgroundColor: 'rgba(255,255,255,0.93)' }}
      >
        <img src="/logo.png" alt="Logo" className="w-28 h-28 rounded-full object-contain" />
      </div>
      <h1 className="text-4xl font-bold tracking-wide text-center" style={{ color: '#1e7575' }}>
        Exploring Watamu
      </h1>
      <p className="text-xl font-medium mt-2 text-center" style={{ color: '#ffb347' }}>
        Experiencing the sweetness
      </p>
    </div>
  );
}