const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Default allowed origins (add more as needed)
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'https://exploringwatamu.vercel.app' // your Vercel frontend
];

// Optional: allow adding extra origins via env var FRONTEND_URLS (comma separated)
const envOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

console.log('[server] CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // allow requests like curl/postman or server-to-server without origin
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

// **Add this line for admin authentication**
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));