import React from 'react';
import { Link } from 'react-router-dom';
import { FaBed, FaCar, FaMap, FaSparkles, FaCarSide, FaHome } from 'react-icons/fa';

const features = [
  { title: 'Accommodation', icon: <FaBed />, to: '/hotels' },
  { title: 'Transfers', icon: <FaCar />, to: '/transfers' },
  { title: 'Tours & Excursions', icon: <FaMap />, to: '/tours' },
  { title: 'Services', icon: <FaSparkles />, to: '/services' },
  { title: 'Car Hire', icon: <FaCarSide />, to: '/carhire' },
  { title: 'Properties For Sale', icon: <FaHome />, to: '/properties-for-sale' },
];

export default function NavigationGrid() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-4 mb-8 space-y-4">
      {features.map((feature) => (
        <Link
          key={feature.title}
          to={feature.to}
          className="flex items-center bg-white rounded-2xl py-5 px-6 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] group"
        >
          <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary text-2xl mr-4 shadow-sm">
            {feature.icon}
          </div>
          <span className="text-primary-dark font-semibold text-lg flex-1 group-hover:text-primary transition-colors">
            {feature.title}
          </span>
          <span className="text-accent text-xl">›</span>
        </Link>
      ))}
    </div>
  );
}