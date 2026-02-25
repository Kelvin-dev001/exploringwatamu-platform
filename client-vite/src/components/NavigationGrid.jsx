import React from 'react';
import { Link } from 'react-router-dom';
import { FaBed, FaCar, FaMap, FaStar, FaCarSide, FaHome } from 'react-icons/fa';

const features = [
  { title: 'Accommodation', icon: <FaBed size={24} />, to: '/hotels' },
  { title: 'Transfers', icon: <FaCar size={24} />, to: '/transfers' },
  { title: 'Tours & Excursions', icon: <FaMap size={24} />, to: '/tours' },
  { title: 'Services', icon: <FaStar size={24} />, to: '/services' },
  { title: 'Car Hire', icon: <FaCarSide size={24} />, to: '/carhire' },
  { title: 'Properties For Sale', icon: <FaHome size={24} />, to: '/properties-for-sale' },
];

export default function NavigationGrid() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-4 mb-8 space-y-4">
      {features.map((feature) => (
        <Link
          key={feature.title}
          to={feature.to}
          className="flex items-center bg-white rounded-2xl py-5 px-6 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4 shadow-sm"
            style={{ backgroundColor: '#fbeec1', color: '#24b3b3' }}
          >
            {feature.icon}
          </div>
          <span className="font-semibold text-lg flex-1" style={{ color: '#1e7575' }}>
            {feature.title}
          </span>
          <span style={{ color: '#46c3d6' }} className="text-xl">›</span>
        </Link>
      ))}
    </div>
  );
}