import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaBed, FaCar, FaMap, FaStar, FaCarSide, FaBuilding } from 'react-icons/fa';

const navLinks = [
  { to: '/', label: 'Home', icon: <FaHome /> },
  { to: '/hotels', label: 'Accommodation', icon: <FaBed /> },
  { to: '/transfers', label: 'Transfers', icon: <FaCar /> },
  { to: '/tours', label: 'Tours', icon: <FaMap /> },
  { to: '/services', label: 'Services', icon: <FaStar /> },
  { to: '/carhire', label: 'Car Hire', icon: <FaCarSide /> },
  { to: '/properties-for-sale', label: 'Properties', icon: <FaBuilding /> },
];

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fbeec1' }}>
      {/* Navbar */}
      <nav className="shadow-lg sticky top-0 z-50" style={{ backgroundColor: '#24b3b3' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
            <span className="text-white font-bold text-base sm:text-xl">
              Exploring Watamu
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: location.pathname === link.to ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: location.pathname === link.to ? '#ffffff' : 'rgba(255,255,255,0.85)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Hamburger button */}
          <button
            className="lg:hidden text-white text-2xl p-2 rounded-lg active:bg-white/20 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile slide-in menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-50 transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: '#1e7575' }}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/10">
          <span className="text-white font-bold text-lg">Menu</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-white text-2xl p-1"
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="py-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-5 py-3.5 text-base font-medium transition-all duration-200"
              style={{
                backgroundColor: location.pathname === link.to ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: location.pathname === link.to ? '#ffffff' : 'rgba(255,255,255,0.8)',
                borderLeft: location.pathname === link.to ? '3px solid #ffb347' : '3px solid transparent',
              }}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1e7575' }} className="text-center py-6 sm:py-8">
        <p className="text-white/70 text-xs sm:text-sm">
          © {new Date().getFullYear()} Exploring Watamu. All rights reserved.
        </p>
        <p className="text-white/50 text-xs mt-1">
          Experiencing the sweetness of Watamu, Kenya 🇰🇪
        </p>
      </footer>
    </div>
  );
}