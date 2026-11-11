import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { useAdminAuth } from './context/AdminAuthContext';
import AppShell from '@/shell/AppShell';
import RouteError from '@/shell/RouteError';
import { Skeleton } from '@/ui';

// Every screen loads on demand so the first visit (often on a phone) stays light.
const Login = lazy(() => import('@/screens/Login'));
const Dashboard = lazy(() => import('@/screens/Dashboard'));
const TripRequests = lazy(() => import('@/screens/TripRequests'));
const TripRequest = lazy(() => import('@/screens/TripRequest'));
const Team = lazy(() => import('@/screens/Team'));
const Bookings = lazy(() => import('@/screens/Bookings'));
const GroupTripBookings = lazy(() => import('@/screens/GroupTripBookings'));
const Notifications = lazy(() => import('@/screens/Notifications'));
const Experiences = lazy(() => import('@/screens/catalogue/Experiences'));
const GroupTrips = lazy(() => import('@/screens/catalogue/GroupTrips'));
const lists = () => import('@/screens/catalogue/configs');
const Stays = lazy(() => lists().then((m) => ({ default: m.Stays })));
const Transfers = lazy(() => lists().then((m) => ({ default: m.Transfers })));
const CarHire = lazy(() => lists().then((m) => ({ default: m.CarHire })));
const Vehicles = lazy(() => lists().then((m) => ({ default: m.Vehicles })));
const Services = lazy(() => lists().then((m) => ({ default: m.Services })));
const Properties = lazy(() => lists().then((m) => ({ default: m.Properties })));
const ExperienceForm = lazy(() => import('@/screens/forms/ExperienceForm'));
const GroupTripForm = lazy(() => import('@/screens/forms/GroupTripForm'));
const StayForm = lazy(() => import('@/screens/forms/StayForm'));
const simple = () => import('@/screens/forms/SimpleForms');
const TransferForm = lazy(() => simple().then((m) => ({ default: m.TransferForm })));
const CarHireForm = lazy(() => simple().then((m) => ({ default: m.CarHireForm })));
const VehicleForm = lazy(() => simple().then((m) => ({ default: m.VehicleForm })));
const ServiceForm = lazy(() => simple().then((m) => ({ default: m.ServiceForm })));
const PropertyForm = lazy(() => simple().then((m) => ({ default: m.PropertyForm })));

const Loading = () => (
  <div className="space-y-4" role="status" aria-label="Loading"><Skeleton className="h-9 w-56" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>
);

function Protected() {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return (
    <AppShell>
      <Suspense fallback={<Loading />}><Outlet /></Suspense>
    </AppShell>
  );
}

/** list + /new + /:id routes for a catalogue type */
const crud = (path, List, Form) => [
  { path, element: <List /> },
  { path: `${path}/new`, element: <Form key="new" /> },
  { path: `${path}/:id`, element: <Form /> },
];

const router = createBrowserRouter([
  { path: '/admin/login', element: <Suspense fallback={null}><Login /></Suspense>, errorElement: <RouteError /> },
  {
    element: <Protected />,
    // A crash or a stale build (after a deploy) shows a way back, and is reported.
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard', element: <Dashboard /> },
      { path: '/trip-requests', element: <TripRequests /> },
      { path: '/trip-requests/:id', element: <TripRequest /> },
      { path: '/bookings', element: <Bookings /> },
      { path: '/grouptripbookings/:tripId', element: <GroupTripBookings /> },
      { path: '/notifications', element: <Notifications /> },
      { path: '/team', element: <Team /> },
      ...crud('/tours', Experiences, ExperienceForm),
      ...crud('/grouptrips', GroupTrips, GroupTripForm),
      ...crud('/hotels', Stays, StayForm),
      ...crud('/transfers', Transfers, TransferForm),
      ...crud('/carhire', CarHire, CarHireForm),
      ...crud('/vehicles', Vehicles, VehicleForm),
      ...crud('/services', Services, ServiceForm),
      ...crud('/properties', Properties, PropertyForm),
      // Old per-type booking pages now live in Bookings.
      { path: '/tourbookings', element: <Navigate to="/bookings?type=tour" replace /> },
      { path: '/servicebookings', element: <Navigate to="/bookings?type=service" replace /> },
      { path: '/carhirebookings', element: <Navigate to="/bookings?type=carhire" replace /> },
      { path: '/propertyviewingbookings', element: <Navigate to="/bookings?type=propertyviewing" replace /> },
      { path: '/transferbookings', element: <Navigate to="/bookings" replace /> },
      { path: '*', element: <Navigate to="/admin/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
