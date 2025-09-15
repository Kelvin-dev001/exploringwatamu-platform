import React from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { name: "Dashboard", to: "/admin/dashboard" },
  { name: "Hotels", to: "/hotels" },
  { name: "Transfers", to: "/transfers" },
  { name: "Tours", to: "/tours" },
  { name: "Services", to: "/services" },
  { name: "Car Hire", to: "/carhire" },
  { name: "Properties", to: "/properties" },
  { name: "Vehicles", to: "/vehicles" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="bg-primary text-base-100 shadow-md">
      <nav className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Exploring Watamu" className="h-10" />
          <span className="font-bold text-xl tracking-wide">Exploring Watamu</span>
        </div>
        <ul className="flex gap-2">
          {navLinks.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`px-3 py-2 rounded hover:bg-primary-focus transition-all ${
                  pathname === link.to ? "bg-primary-focus" : ""
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        {/* Optional: Add user avatar, logout, etc. here */}
      </nav>
    </header>
  );
}