import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';

// Page imports
import AdminDashboard from './pages/AdminDashboard';
// Hotels
import HotelList from './pages/hotels/HotelList';
import NewHotel from './pages/hotels/NewHotel';
import EditHotel from './pages/hotels/EditHotel';
// Transfers
import TransferList from './pages/transfers/TransferList';
import NewTransfer from './pages/transfers/NewTransfer';
import EditTransfer from './pages/transfers/EditTransfer';
import TransferBookingList from './pages/transfers/TransferBookingList';
// Services
import ServiceList from './pages/services/ServiceList';
import NewService from './pages/services/NewService';
import EditService from './pages/services/EditService';
import ServiceBookingList from './pages/services/ServiceBookingList';
// Vehicles
import VehicleList from './pages/vehicles/VehicleList';
import NewVehicle from './pages/vehicles/NewVehicle';
import EditVehicle from './pages/vehicles/EditVehicle';
// Properties
import PropertyList from './pages/properties/PropertyList';
import NewProperty from './pages/properties/NewProperty';
import EditProperty from './pages/properties/EditProperty';
import PropertyViewingBookingList from './pages/properties/PropertyViewingBookingList';
// Car Hire
import CarHireList from './pages/carhire/CarHireList';
import NewCarHire from './pages/carhire/NewCarHire';
import EditCarHire from './pages/carhire/EditCarHire';
import CarHireBookingList from './pages/carhire/CarHireBookingList';
// Tours
import TourList from './pages/tours/TourList';
import NewTour from './pages/tours/NewTour';
import EditTour from './pages/tours/EditTour';
import TourBookingList from './pages/tours/TourBookingList';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Admin Dashboard */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Hotels */}
          <Route path="/hotels" element={<HotelList />} />
          <Route path="/hotels/new" element={<NewHotel />} />
          <Route path="/hotels/:id" element={<EditHotel />} />

          {/* Transfers */}
          <Route path="/transfers" element={<TransferList />} />
          <Route path="/transfers/new" element={<NewTransfer />} />
          <Route path="/transfers/:id" element={<EditTransfer />} />
          <Route path="/transferbookings" element={<TransferBookingList />} />

          {/* Services */}
          <Route path="/services" element={<ServiceList />} />
          <Route path="/services/new" element={<NewService />} />
          <Route path="/services/:id" element={<EditService />} />
          <Route path="/servicebookings" element={<ServiceBookingList />} />

          {/* Vehicles */}
          <Route path="/vehicles" element={<VehicleList />} />
          <Route path="/vehicles/new" element={<NewVehicle />} />
          <Route path="/vehicles/:id" element={<EditVehicle />} />

          {/* Properties */}
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/new" element={<NewProperty />} />
          <Route path="/properties/:id" element={<EditProperty />} />
          <Route path="/propertyviewingbookings" element={<PropertyViewingBookingList />} />

          {/* Car Hire */}
          <Route path="/carhire" element={<CarHireList />} />
          <Route path="/carhire/new" element={<NewCarHire />} />
          <Route path="/carhire/:id" element={<EditCarHire />} />
          <Route path="/carhirebookings" element={<CarHireBookingList />} />

          {/* Tours */}
          <Route path="/tours" element={<TourList />} />
          <Route path="/tours/new" element={<NewTour />} />
          <Route path="/tours/:id" element={<EditTour />} />
          <Route path="/tourbookings" element={<TourBookingList />} />

          {/* Default route/fallback */}
          <Route path="/" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;