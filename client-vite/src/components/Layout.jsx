import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/hotels', label: 'Accommodation' },
  { to: '/transfers', label: 'Transfers' },
  { to: '/tours', label: 'Tours' },
  { to: '/services', label: 'Services' },
  { to: '/carhire', label: 'Car Hire' },
  { to: '/properties-for-sale', label: 'Properties' },
];

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fbeec1' }}>
      {/* Navbar */}
      <nav className="shadow-lg sticky top-0 z-50" style={{ backgroundColor: '#24b3b3' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
            <span className="text-white font-bold text-xl hidden sm:block">
              Exploring Watamu
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: location.pathname === link.to ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: location.pathname === link.to ? '#ffffff' : 'rgba(255,255,255,0.8)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10" style={{ backgroundColor: '#1e7575' }}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: location.pathname === link.to ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: location.pathname === link.to ? '#ffffff' : 'rgba(255,255,255,0.8)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm" style={{ backgroundColor: '#1e7575', color: 'rgba(255,255,255,0.7)' }}>
        © {new Date().getFullYear()} Exploring Watamu. All rights reserved.
      </footer>
    </div>
  );
}