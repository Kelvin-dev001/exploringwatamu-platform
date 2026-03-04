import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function MyTrips() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user && token) {
      axios.get(`${API_URL}/group-bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setBookings(Array.isArray(res.data) ? res.data : []))
        .catch(() => setError('Failed to load your bookings.'))
        .finally(() => setLoading(false));
    }
  }, [user, token, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg" style={{ color: '#24b3b3' }}></span>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-gray-500 py-24">{error}</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1" style={{ color: '#24b3b3' }}>My Trips</h1>
      <p className="text-gray-500 text-sm mb-8">Your group trip bookings</p>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <p className="text-4xl mb-4">🏝️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h2>
          <p className="text-gray-500 text-sm mb-6">You haven't joined any group trips yet. Find your adventure!</p>
          <Link to="/group-trips" className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#24b3b3' }}>
            Browse Group Trips
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const trip = booking.trip;
            return (
              <div key={booking._id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex gap-4 p-5">
                  {trip?.heroImage && (
                    <img src={trip.heroImage} alt={trip.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h2 className="font-bold text-lg leading-tight" style={{ color: '#1e7575' }}>
                        {trip?.title || 'Trip'}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                        {booking.status}
                      </span>
                    </div>
                    {trip && (
                      <p className="text-xs text-gray-500 mt-1">
                        📅 {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                        {trip.meetingPoint && <span className="ml-3">📍 {trip.meetingPoint}</span>}
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs block">Payment</span>
                        <span className="font-medium capitalize">{booking.paymentType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs block">Amount Paid</span>
                        <span className="font-medium text-green-700">KES {booking.amountPaid?.toLocaleString()}</span>
                      </div>
                      {booking.amountDue > 0 && (
                        <div>
                          <span className="text-gray-400 text-xs block">Balance Due</span>
                          <span className="font-medium text-orange-600">KES {booking.amountDue?.toLocaleString()}</span>
                        </div>
                      )}
                      {trip?.balanceDueDate && booking.paymentType === 'deposit' && (
                        <div>
                          <span className="text-gray-400 text-xs block">Due Date</span>
                          <span className="font-medium">{formatDate(trip.balanceDueDate)}</span>
                        </div>
                      )}
                      {booking.mpesaReceiptNumber && (
                        <div className="col-span-2">
                          <span className="text-gray-400 text-xs block">M-Pesa Receipt</span>
                          <span className="font-mono font-medium text-xs">{booking.mpesaReceiptNumber}</span>
                        </div>
                      )}
                    </div>
                    {trip?.slug && (
                      <Link to={`/group-trips/${trip.slug}`} className="mt-3 inline-block text-xs font-medium" style={{ color: '#24b3b3' }}>
                        View trip details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
