import React from 'react';

export default function AnnouncementBanner({ message }) {
  if (!message) return null;
  return (
    <div
      className="rounded-xl px-6 py-3 text-center font-medium shadow-sm mb-8"
      style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#1e7575' }}
    >
      {message}
    </div>
  );
}