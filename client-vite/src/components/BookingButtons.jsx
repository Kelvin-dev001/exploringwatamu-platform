import React from 'react';

export default function BookingButtons({ whatsapp, email }) {
  return (
    <div className="flex gap-3 mt-4">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg text-center hover:bg-green-600 transition-colors"
      >
        Book via WhatsApp
      </a>
      <a
        href={`mailto:${email}`}
        className="flex-1 bg-primary text-white font-bold py-3 rounded-lg text-center hover:bg-primary-dark transition-colors"
      >
        Book via Email
      </a>
    </div>
  );
}