import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ImageGallery from '../components/ImageGallery.jsx';

export default function CarHire() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/carhire`);
        if (Array.isArray(res.data)) {
          setCars(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setCars(res.data.data);
        } else {
          setCars([]);
        }
      } catch (err) {
        setError('Failed to load cars.');
      }
      setLoading(false);
    };
    fetchCars();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Car Hire
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Hire a car for your adventure in Watamu.
      </p>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-gray-600">{error}</p>
        </div>
      ) : cars.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {cars.map((car) => {
            const vehicleImage = car.vehicle?.image ? [car.vehicle.image] : [];
            const vehicleName = car.vehicle?.name || 'Vehicle';
            return (
              <div key={car._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <ImageGallery images={vehicleImage} alt={vehicleName} />
                <div className="p-5">
                  <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{vehicleName}</h3>
                  {car.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-3">{car.description}</p>
                  )}
                  {car.vehicle?.capacity && (
                    <p className="text-gray-500 text-xs mt-1">👥 {car.vehicle.capacity} seats</p>
                  )}
                  {car.dailyRate != null && (
                    <p className="font-bold text-lg mt-2" style={{ color: '#ffb347' }}>
                      KES {Number(car.dailyRate).toLocaleString()}/day
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🚗</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No cars available yet</h2>
          <p className="text-gray-500">Check back soon for car hire options.</p>
        </div>
      )}
    </div>
  );
}