import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

import HotelList from './components/HotelList';
import TransferList from './components/TransferList';
import TourList from './components/TourList';
import ServiceList from './components/ServiceList';
import CarHireList from './components/CarHireList';

function App() {
  return (
    <Router>
      <header className="bg-brand-teal p-4 flex items-center">
        <img src="/logo.png" alt="Exploring Watamu" style={{ height: 48, marginRight: 16 }} />
        <nav>
          <Link to="/" className="text-brand-cream mx-2">Hotels</Link>
          <Link to="/transfers" className="text-brand-cream mx-2">Transfers</Link>
          <Link to="/tours" className="text-brand-cream mx-2">Tours</Link>
          <Link to="/services" className="text-brand-cream mx-2">Services</Link>
          <Link to="/carhire" className="text-brand-cream mx-2">Car Hire</Link>
        </nav>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<HotelList />} />
          <Route path="/transfers" element={<TransferList />} />
          <Route path="/tours" element={<TourList />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/carhire" element={<CarHireList />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;