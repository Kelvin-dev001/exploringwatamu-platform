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
import GroupTrips from './pages/GroupTrips.jsx';
import GroupTripDetail from './pages/GroupTripDetail.jsx';
import MyTrips from './pages/MyTrips.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

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
          <Route path="/group-trips" element={<GroupTrips />} />
          <Route path="/group-trips/:slug" element={<GroupTripDetail />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;