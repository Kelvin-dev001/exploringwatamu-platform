import React from 'react';
import { Link } from 'react-router-dom';
import { FaBed, FaCar, FaMap, FaStar, FaCarSide, FaHome, FaUsers } from 'react-icons/fa';

const features = [
  { title: 'Accommodation', icon: <FaBed size={22} />, to: '/hotels', desc: 'Hotels, Airbnbs & Villas' },
  { title: 'Transfers', icon: <FaCar size={22} />, to: '/transfers', desc: 'Airport & hotel transfers' },
  { title: 'Tours & Excursions', icon: <FaMap size={22} />, to: '/tours', desc: 'Discover Watamu' },
  { title: 'Group Trips', icon: <FaUsers size={22} />, to: '/group-trips', desc: 'Join scheduled group adventures' },
  { title: 'Services', icon: <FaStar size={22} />, to: '/services', desc: 'Local services' },
  { title: 'Car Hire', icon: <FaCarSide size={22} />, to: '/carhire', desc: 'Rent a car' },
  { title: 'Properties For Sale', icon: <FaHome size={22} />, to: '/properties-for-sale', desc: 'Find your dream home' },
];

export default function NavigationGrid() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-4 mb-8">
      {/* Grid on mobile, list on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:hidden">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.to}
            className="flex flex-col items-center bg-white rounded-2xl py-5 px-3 shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm"
              style={{ backgroundColor: '#fbeec1', color: '#24b3b3' }}
            >
              {feature.icon}
            </div>
            <span className="font-semibold text-sm" style={{ color: '#1e7575' }}>
              {feature.title}
            </span>
          </Link>
        ))}
      </div>

      {/* List view on desktop */}
      <div className="hidden sm:flex flex-col space-y-3">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.to}
            className="flex items-center bg-white rounded-2xl py-4 px-5 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 shadow-sm shrink-0"
              style={{ backgroundColor: '#fbeec1', color: '#24b3b3' }}
            >
              {feature.icon}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-lg block" style={{ color: '#1e7575' }}>
                {feature.title}
              </span>
              <span className="text-gray-500 text-sm">{feature.desc}</span>
            </div>
            <span style={{ color: '#46c3d6' }} className="text-xl ml-2">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}