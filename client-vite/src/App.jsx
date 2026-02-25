import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Hotels from './pages/Hotels.jsx';
import Tours from './pages/Tours.jsx';
import Transfers from './pages/Transfers.jsx';
import Services from './pages/Services.jsx';
import CarHire from './pages/CarHire.jsx';
import PropertiesForSale from './pages/PropertiesForSale.jsx';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/services" element={<Services />} />
          <Route path="/carhire" element={<CarHire />} />
          <Route path="/properties-for-sale" element={<PropertiesForSale />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;