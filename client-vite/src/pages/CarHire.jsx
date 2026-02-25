import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import BookingButtons from '../components/BookingButtons.jsx';

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary text-center mb-2">Car Hire</h1>
      <p className="text-primary-dark text-center mb-6">Hire a car for your adventure in Watamu.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
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
                <h3 className="text-xl font-bold text-primary">{car.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{car.description}</p>
                {car.price && <p className="text-secondary font-semibold mt-2">From ${car.price}/day</p>}
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