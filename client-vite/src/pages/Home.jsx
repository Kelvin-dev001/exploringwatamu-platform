import React from 'react';
import HeroSection from '../components/HeroSection.jsx';
import NavigationGrid from '../components/NavigationGrid.jsx';
import AnnouncementBanner from '../components/AnnouncementBanner.jsx';

export default function Home() {
  const announcement = "🌴 Welcome! Explore new properties for sale and enjoy exclusive offers.";

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #24b3b3 0%, #46c3d6 40%, #fbeec1 100%)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnnouncementBanner message={announcement} />
        <HeroSection />
        <NavigationGrid />
      </div>
    </div>
  );
}