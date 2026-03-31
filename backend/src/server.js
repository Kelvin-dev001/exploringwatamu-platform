const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081',
  'https://exploringwatamuadmin.vercel.app',
  'https://exploringwatamu.vercel.app',
  'https://exploringwatamu-platform.vercel.app',
];

const envOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/tours', require('./routes/tourRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/carhire', require('./routes/carHireRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/carhirebookings', require('./routes/carHireBookingRoutes'));
app.use('/api/tourbookings', require('./routes/tourBookingRoutes'));
app.use('/api/servicebookings', require('./routes/serviceBookingRoutes'));
app.use('/api/properties', require('./routes/propertyForSaleRoutes'));
app.use('/api/propertyviewings', require('./routes/propertyViewingBookingRoutes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/userAuth'));
app.use('/api/group-trips', require('./routes/groupTripRoutes'));
app.use('/api/group-bookings', require('./routes/groupBookingRoutes'));
app.use('/api/mpesa', require('./routes/mpesaRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/reviews', require('./routes/reviews'));

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));