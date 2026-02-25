import React from 'react';
import HeroSection from '../components/HeroSection.jsx';
import NavigationGrid from '../components/NavigationGrid.jsx';

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-primary via-accent to-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Announcement */}
        <div className="bg-white/90 rounded-xl px-6 py-3 text-center text-primary-dark font-medium shadow-sm mb-8">
          Welcome! Explore new properties for sale and enjoy exclusive offers.
        </div>
        <HeroSection />
        <NavigationGrid />
      </div>
    </div>
  );
}