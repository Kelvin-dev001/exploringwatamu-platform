import React from 'react';

export default function Footer() {
  return (
    <footer className="text-center py-6 text-sm" style={{ color: '#1e7575', opacity: 0.7 }}>
      © {new Date().getFullYear()} Exploring Watamu. All rights reserved.
    </footer>
  );
}