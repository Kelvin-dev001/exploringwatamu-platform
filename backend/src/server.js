const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
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
app.use('/api/properties', require('./routes/propertyForSaleRoutes')); // <-- Added
app.use('/api/propertyviewings', require('./routes/propertyViewingBookingRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));