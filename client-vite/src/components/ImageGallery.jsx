import React, { useState } from 'react';

export default function ImageGallery({ images, alt = 'Image' }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-52 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <span className="text-4xl opacity-40">📷</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={alt}
        className="w-full h-52 object-cover"
        loading="lazy"
      />
    );
  }

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div className="relative w-full h-52 group">
      <img
        src={images[current]}
        alt={`${alt} ${current + 1}`}
        className="w-full h-52 object-cover transition-opacity duration-300"
        loading="lazy"
      />
      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        aria-label="Next image"
      >
        ›
      </button>
      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === current ? 'bg-white scale-110' : 'bg-white/50'
            }`}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
      {/* Counter */}
      <span className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
        {current + 1}/{images.length}
      </span>
    </div>
  );
}
