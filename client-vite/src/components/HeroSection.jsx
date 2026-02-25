import React from 'react';

export default function HeroSection() {
  return (
    <div className="flex flex-col items-center py-8 animate-fade-in">
      <div className="w-36 h-36 rounded-full bg-white/90 flex items-center justify-center shadow-xl mb-6">
        <img src="/logo.png" alt="Logo" className="w-28 h-28 rounded-full object-contain" />
      </div>
      <h1 className="text-4xl font-bold text-primary-dark tracking-wide text-center">
        Exploring Watamu
      </h1>
      <p className="text-xl text-secondary font-medium mt-2 text-center">
        Experiencing the sweetness
      </p>
    </div>
  );
}