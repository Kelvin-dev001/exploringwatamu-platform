import React from 'react';

export default function BookingButtons({ whatsapp, email }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-white font-bold py-3 rounded-lg text-center text-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ backgroundColor: '#25D366' }}
        >
          📱 Book via WhatsApp
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex-1 text-white font-bold py-3 rounded-lg text-center text-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ backgroundColor: '#24b3b3' }}
        >
          ✉️ Book via Email
        </a>
      )}
    </div>
  );
}