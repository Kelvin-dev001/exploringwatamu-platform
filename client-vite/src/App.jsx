import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import { useI18n } from './i18n';

// Everything except the homepage loads on demand, so first visits stay fast.
const Hotels = lazy(() => import('./pages/Hotels.jsx'));
const Experiences = lazy(() => import('./pages/Experiences.jsx'));
const ExperienceDetail = lazy(() => import('./pages/ExperienceDetail.jsx'));
const Transfers = lazy(() => import('./pages/Transfers.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const CarHire = lazy(() => import('./pages/CarHire.jsx'));
const PropertiesForSale = lazy(() => import('./pages/PropertiesForSale.jsx'));
const GroupTrips = lazy(() => import('./pages/GroupTrips.jsx'));
const GroupTripDetail = lazy(() => import('./pages/GroupTripDetail.jsx'));
const MyTrips = lazy(() => import('./pages/MyTrips.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const StyleGuide = lazy(() => import('./pages/StyleGuide.jsx'));
const TripPlanner = lazy(() => import('./pages/TripPlanner.jsx'));
const TripRequested = lazy(() => import('./pages/TripRequested.jsx'));
const WriteReview = lazy(() => import('./pages/WriteReview.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function PageFallback() {
  const { t } = useI18n();
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-label={t('pageLoading')}>
      <span className="size-8 animate-spin rounded-full border-2 border-sand-300 border-t-coral-500" />
    </div>
  );
}

function App() {
  return (
    <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/experiences/:id" element={<ExperienceDetail />} />
            {/* Old links keep working */}
            <Route path="/tours" element={<Navigate to="/experiences" replace />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/services" element={<Services />} />
            <Route path="/carhire" element={<CarHire />} />
            <Route path="/properties-for-sale" element={<PropertiesForSale />} />
            <Route path="/group-trips" element={<GroupTrips />} />
            <Route path="/group-trips/:slug" element={<GroupTripDetail />} />
            <Route path="/trip" element={<TripPlanner />} />
            <Route path="/trip/sent/:reference" element={<TripRequested />} />
            <Route path="/my-trips" element={<MyTrips />} />
            <Route path="/review/:bookingType/:bookingId" element={<WriteReview />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/style-guide" element={<StyleGuide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
    </Layout>
  );
}

export default App;
