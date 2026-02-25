import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import BookingButtons from '../components/BookingButtons.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function CarHire() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/carhire`);
        setCars(res.data);
      } catch (err) {
        setError('Failed to load cars.');
      }
      setLoading(false);
    };
    fetchCars();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ backgroundColor: '#fbeec1', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#24b3b3' }}>
        Car Hire
      </h1>
      <p className="text-center mb-6" style={{ color: '#1e7575' }}>
        Hire a car for your adventure in Watamu.
      </p>

      {loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <p className="text-center text-gray-500 py-16">{error}</p>
      ) : cars.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {cars.map((car) => (
            <div key={car._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {car.images && car.images[0] && (
                <img src={car.images[0]} alt={car.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-xl font-bold" style={{ color: '#24b3b3' }}>{car.name}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">{car.description}</p>
                {car.price && (
                  <p className="font-semibold mt-2" style={{ color: '#ffb347' }}>From ${car.price}/day</p>
                )}
                {(car.whatsapp || car.email) && (
                  <BookingButtons whatsapp={car.whatsapp} email={car.email} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-16">No cars available yet.</p>
      )}
    </div>
  );
}