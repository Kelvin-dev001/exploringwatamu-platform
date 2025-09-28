import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAdminAuth } from './context/AdminAuthContext';

// Page imports
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/login'; // Import your login page
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

// PrivateRoute component to protect authenticated routes
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard (Protected) */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Hotels (Protected) */}
          <Route
            path="/hotels"
            element={
              <PrivateRoute>
                <HotelList />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotels/new"
            element={
              <PrivateRoute>
                <NewHotel />
              </PrivateRoute>
            }
          />
          <Route
            path="/hotels/:id"
            element={
              <PrivateRoute>
                <EditHotel />
              </PrivateRoute>
            }
          />

          {/* Transfers (Protected) */}
          <Route
            path="/transfers"
            element={
              <PrivateRoute>
                <TransferList />
              </PrivateRoute>
            }
          />
          <Route
            path="/transfers/new"
            element={
              <PrivateRoute>
                <NewTransfer />
              </PrivateRoute>
            }
          />
          <Route
            path="/transfers/:id"
            element={
              <PrivateRoute>
                <EditTransfer />
              </PrivateRoute>
            }
          />
          <Route
            path="/transferbookings"
            element={
              <PrivateRoute>
                <TransferBookingList />
              </PrivateRoute>
            }
          />

          {/* Services (Protected) */}
          <Route
            path="/services"
            element={
              <PrivateRoute>
                <ServiceList />
              </PrivateRoute>
            }
          />
          <Route
            path="/services/new"
            element={
              <PrivateRoute>
                <NewService />
              </PrivateRoute>
            }
          />
          <Route
            path="/services/:id"
            element={
              <PrivateRoute>
                <EditService />
              </PrivateRoute>
            }
          />
          <Route
            path="/servicebookings"
            element={
              <PrivateRoute>
                <ServiceBookingList />
              </PrivateRoute>
            }
          />

          {/* Vehicles (Protected) */}
          <Route
            path="/vehicles"
            element={
              <PrivateRoute>
                <VehicleList />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles/new"
            element={
              <PrivateRoute>
                <NewVehicle />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicles/:id"
            element={
              <PrivateRoute>
                <EditVehicle />
              </PrivateRoute>
            }
          />

          {/* Properties (Protected) */}
          <Route
            path="/properties"
            element={
              <PrivateRoute>
                <PropertyList />
              </PrivateRoute>
            }
          />
          <Route
            path="/properties/new"
            element={
              <PrivateRoute>
                <NewProperty />
              </PrivateRoute>
            }
          />
          <Route
            path="/properties/:id"
            element={
              <PrivateRoute>
                <EditProperty />
              </PrivateRoute>
            }
          />
          <Route
            path="/propertyviewingbookings"
            element={
              <PrivateRoute>
                <PropertyViewingBookingList />
              </PrivateRoute>
            }
          />

          {/* Car Hire (Protected) */}
          <Route
            path="/carhire"
            element={
              <PrivateRoute>
                <CarHireList />
              </PrivateRoute>
            }
          />
          <Route
            path="/carhire/new"
            element={
              <PrivateRoute>
                <NewCarHire />
              </PrivateRoute>
            }
          />
          <Route
            path="/carhire/:id"
            element={
              <PrivateRoute>
                <EditCarHire />
              </PrivateRoute>
            }
          />
          <Route
            path="/carhirebookings"
            element={
              <PrivateRoute>
                <CarHireBookingList />
              </PrivateRoute>
            }
          />

          {/* Tours (Protected) */}
          <Route
            path="/tours"
            element={
              <PrivateRoute>
                <TourList />
              </PrivateRoute>
            }
          />
          <Route
            path="/tours/new"
            element={
              <PrivateRoute>
                <NewTour />
              </PrivateRoute>
            }
          />
          <Route
            path="/tours/:id"
            element={
              <PrivateRoute>
                <EditTour />
              </PrivateRoute>
            }
          />
          <Route
            path="/tourbookings"
            element={
              <PrivateRoute>
                <TourBookingList />
              </PrivateRoute>
            }
          />

          {/* Default route/fallback (Protected) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;