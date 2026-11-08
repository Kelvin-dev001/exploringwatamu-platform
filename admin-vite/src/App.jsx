import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AppShell from '@/shell/AppShell';
import { useAdminAuth } from './context/AdminAuthContext';

// Page imports
import Dashboard from '@/screens/Dashboard';
import Bookings from '@/screens/Bookings';
import GroupTripBookings from '@/screens/GroupTripBookings';
import Notifications from '@/screens/Notifications';
import Experiences from '@/screens/catalogue/Experiences';
import GroupTripsList from '@/screens/catalogue/GroupTrips';
import { Stays, Transfers, CarHire, Vehicles, Services, Properties } from '@/screens/catalogue/configs';
import TeamPage from '@/screens/Team';
import AdminLogin from './pages/login'; // Import your login page
// Hotels
import NewHotel from './pages/hotels/NewHotel';
import EditHotel from './pages/hotels/EditHotel';
// Transfers
import NewTransfer from './pages/transfers/NewTransfer';
import EditTransfer from './pages/transfers/EditTransfer';
// Services
import NewService from './pages/services/NewService';
import EditService from './pages/services/EditService';
// Vehicles
import NewVehicle from './pages/vehicles/NewVehicle';
import EditVehicle from './pages/vehicles/EditVehicle';
// Properties
import NewProperty from './pages/properties/NewProperty';
import EditProperty from './pages/properties/EditProperty';
// Car Hire
import NewCarHire from './pages/carhire/NewCarHire';
import EditCarHire from './pages/carhire/EditCarHire';
// Tours
import NewTour from './pages/tours/NewTour';
import EditTour from './pages/tours/EditTour';
// Group Trips
import NewGroupTrip from './pages/grouptrips/NewGroupTrip';
import EditGroupTrip from './pages/grouptrips/EditGroupTrip';
// Bookings & Notifications
import TripRequestList from '@/screens/TripRequests';
import TripRequestDetail from '@/screens/TripRequest';

// PrivateRoute component to protect authenticated routes
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard (Protected) */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Unified bookings + notifications (Protected) */}
          <Route
            path="/bookings"
            element={
              <PrivateRoute>
                <Bookings />
              </PrivateRoute>
            }
          />
          <Route
            path="/trip-requests"
            element={
              <PrivateRoute>
                <TripRequestList />
              </PrivateRoute>
            }
          />
          <Route
            path="/trip-requests/:id"
            element={
              <PrivateRoute>
                <TripRequestDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />

          {/* Hotels (Protected) */}
          <Route
            path="/hotels"
            element={
              <PrivateRoute>
                <Stays />
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
                <Transfers />
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
            element={<Navigate to="/bookings" replace />}
          />

          {/* Services (Protected) */}
          <Route
            path="/services"
            element={
              <PrivateRoute>
                <Services />
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
            element={<Navigate to="/bookings?type=service" replace />}
          />

          {/* Vehicles (Protected) */}
          <Route
            path="/vehicles"
            element={
              <PrivateRoute>
                <Vehicles />
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
                <Properties />
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
            element={<Navigate to="/bookings?type=propertyviewing" replace />}
          />

          {/* Car Hire (Protected) */}
          <Route
            path="/carhire"
            element={
              <PrivateRoute>
                <CarHire />
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
            element={<Navigate to="/bookings?type=carhire" replace />}
          />

          {/* Tours (Protected) */}
          <Route
            path="/tours"
            element={
              <PrivateRoute>
                <Experiences />
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
            element={<Navigate to="/bookings?type=tour" replace />}
          />

          {/* Default route/fallback (Protected) */}
          <Route
            path="/"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/team"
            element={
              <PrivateRoute>
                <TeamPage />
              </PrivateRoute>
            }
          />

          {/* Group Trips (Protected) */}
          <Route
            path="/grouptrips"
            element={
              <PrivateRoute>
                <GroupTripsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/grouptrips/new"
            element={
              <PrivateRoute>
                <NewGroupTrip />
              </PrivateRoute>
            }
          />
          <Route
            path="/grouptrips/:id"
            element={
              <PrivateRoute>
                <EditGroupTrip />
              </PrivateRoute>
            }
          />
          <Route
            path="/grouptripbookings/:tripId"
            element={
              <PrivateRoute>
                <GroupTripBookings />
              </PrivateRoute>
            }
          />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;