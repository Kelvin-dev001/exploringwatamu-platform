import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TravelVibeSelector from '../components/TravelVibeSelector.jsx';
import ParticipantCarousel from '../components/ParticipantCarousel.jsx';
import ECardPreview from '../components/ECardPreview.jsx';
import ReferralCard from '../components/ReferralCard.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export default function GroupTripDetail() {
  const { slug } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    paymentType: 'deposit',
    travelPersonalities: [],
    travelGroup: '',
    selectedAvatar: 'avatar_1.png',
  });
  const [modalStep, setModalStep] = useState('form'); // 'form' | 'vibe' | 'payment' | 'processing' | 'success' | 'error'
  const [modalError, setModalError] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [bookingData, setBookingData] = useState(null);

  const countdown = useCountdown(trip?.startDate);

  useEffect(() => {
    axios.get(`${API_URL}/group-trips/${slug}`)
      .then(res => setTrip(res.data))
      .catch(() => setError('Trip not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleVibeComplete = (vibeData) => {
    setFormData(prev => ({
      ...prev,
      ...vibeData,
    }));
    setModalStep('payment');
  };

  const pollPaymentStatus = useCallback(async (crid, bookingId, attempts = 0) => {
    if (attempts >= 12) {
      setModalStep('error');
      setModalError('Payment confirmation timed out. If you completed the M-Pesa payment, please contact us with your receipt number.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/mpesa/query`, { checkoutRequestId: crid }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const code = res.data?.ResultCode;
      if (code === 0 || String(code) === '0') {
        // Confirm booking on backend
        await axios.post(`${API_URL}/group-bookings/confirm`, {
          bookingId,
          mpesaReceiptNumber: res.data?.mpesaReceiptNumber,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch booking data for e-card
        const bookingRes = await axios.get(`${API_URL}/group-bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookingData(bookingRes.data);
        setModalStep('success');
        return;
      }
      if (code !== undefined && code !== null && String(code) !== '0') {
        setModalStep('error');
        setModalError(res.data?.ResultDesc || 'Payment was not completed.');
        return;
      }
    } catch {
      // ignore and retry
    }
    setTimeout(() => pollPaymentStatus(crid, bookingId, attempts + 1), 5000);
  }, [token]);

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalStep('processing');

    try {
      const amount = formData.paymentType === 'full' ? trip.fullPrice : trip.depositAmount;

      // Step 1: Create booking with vibe data
      const bookingRes = await axios.post(`${API_URL}/group-bookings/join`, {
        tripId: trip._id,
        paymentType: formData.paymentType,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        travelPersonalities: formData.travelPersonalities,
        travelGroup: formData.travelGroup,
        selectedAvatar: formData.selectedAvatar,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const bookingId = bookingRes.data.booking._id;

      // Step 2: Trigger STK push
      const stkRes = await axios.post(`${API_URL}/mpesa/stkpush`, {
        bookingId,
        phone: formData.phone,
        amount,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const crid = stkRes.data.checkoutRequestId;
      setCheckoutRequestId(crid);

      // Step 3: Poll for status
      setTimeout(() => pollPaymentStatus(crid, bookingId, 0), 5000);
    } catch (err) {
      setModalStep('error');
      setModalError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg" style={{ color: '#24b3b3' }}></span>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="text-center py-24 px-4">
        <p className="text-2xl mb-3">😕</p>
        <p className="text-gray-600">{error || 'Trip not found.'}</p>
        <Link to="/group-trips" className="mt-4 inline-block text-sm font-medium" style={{ color: '#24b3b3' }}>← Back to Trips</Link>
      </div>
    );
  }

  const slotsLeft = trip.slotsRemaining ?? (trip.maxParticipants - trip.confirmedParticipants);
  const isFull = trip.status === 'full' || slotsLeft <= 0;
  const isClosed = trip.status === 'closed';
  const slotPercent = Math.min(100, Math.round((trip.confirmedParticipants / trip.maxParticipants) * 100));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fbeec1' }}>
      {/* Hero */}
      <div className="relative w-full h-72 sm:h-96 overflow-hidden">
        {trip.heroImage ? (
          <img src={trip.heroImage} alt={trip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#24b3b3' }}>
            <span className="text-7xl">🏖️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-1">{trip.title}</h1>
          <p className="text-white/80 text-sm sm:text-base">
            📅 {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            {trip.meetingPoint && <span className="ml-4">📍 {trip.meetingPoint}</span>}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Countdown */}
          {!isFull && !isClosed && countdown.days !== undefined && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 mb-3 text-center">⏰ Trip starts in</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['days', countdown.days], ['hours', countdown.hours], ['minutes', countdown.minutes], ['seconds', countdown.seconds]].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-3xl font-bold" style={{ color: '#24b3b3' }}>{String(val ?? 0).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-500 uppercase">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slots progress */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span style={{ color: '#1e7575' }}>{trip.confirmedParticipants} of {trip.maxParticipants} spots filled</span>
              <span className={`font-bold ${slotsLeft < 3 ? 'text-red-500' : 'text-green-600'}`}>{isFull ? 'FULL' : `${slotsLeft} left`}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${slotPercent}%`, backgroundColor: slotsLeft < 3 ? '#ef4444' : '#24b3b3' }}
              />
            </div>
          </div>

          {/* Who is In Carousel - NEW FEATURE 1 */}
          <ParticipantCarousel tripId={trip._id} />

          {/* Description */}
          {trip.fullDescription && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#1e7575' }}>About This Trip</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{trip.fullDescription}</p>
            </div>
          )}

          {/* Itinerary */}
          {trip.itinerary && trip.itinerary.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1e7575' }}>Itinerary</h2>
              <div className="space-y-4">
                {trip.itinerary.map((day, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ backgroundColor: '#24b3b3' }}>
                        {day.day}
                      </div>
                      {i < trip.itinerary.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-gray-800">{day.title}</p>
                      {day.activities && day.activities.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {day.activities.map((act, j) => (
                            <li key={j} className="text-sm text-gray-500 flex items-start gap-1.5">
                              <span className="mt-0.5 shrink-0">•</span> {act}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Includes / Excludes */}
          {((trip.includes && trip.includes.length > 0) || (trip.excludes && trip.excludes.length > 0)) && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {trip.includes && trip.includes.length > 0 && (
                  <div>
                    <h3 className="font-bold text-green-700 mb-3">✅ Included</h3>
                    <ul className="space-y-1.5">
                      {trip.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-0.5 shrink-0">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {trip.excludes && trip.excludes.length > 0 && (
                  <div>
                    <h3 className="font-bold text-red-600 mb-3">❌ Not Included</h3>
                    <ul className="space-y-1.5">
                      {trip.excludes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-red-400 mt-0.5 shrink-0">✗</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gallery */}
          {trip.gallery && trip.gallery.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1e7575' }}>Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trip.gallery.map((img, i) => (
                  <img key={i} src={img} alt={`Gallery ${i + 1}`} className="rounded-xl h-36 w-full object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky pricing box */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-6 lg:sticky lg:top-20 space-y-4">
            {/* Referral Card - NEW FEATURE 4 */}
            {user && <ReferralCard />}

            {/* Pricing */}
            <div className="border-t pt-4">
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-0.5">Full Price</p>
                <p className="text-2xl font-bold" style={{ color: '#1e7575' }}>KES {trip.fullPrice?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-2 mb-0.5">Deposit to secure your spot</p>
                <p className="text-xl font-bold" style={{ color: '#ffb347' }}>KES {trip.depositAmount?.toLocaleString()}</p>
              </div>

              {isClosed ? (
                <button disabled className="w-full py-3 rounded-xl font-bold text-white bg-gray-400 cursor-not-allowed">Trip Closed</button>
              ) : isFull ? (
                <button disabled className="w-full py-3 rounded-xl font-bold text-white bg-gray-400 cursor-not-allowed">Trip Full</button>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full py-3 rounded-xl font-bold text-white text-lg transition-opacity hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#ffb347' }}
                >
                  Join This Trip 🚀
                </button>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm text-gray-500">
                <p>🔒 Secure M-Pesa Payment</p>
                <p>✅ Verified Experience</p>
                <p>👥 Group Adventure</p>
              </div>

              {trip.balanceDueDate && (
                <p className="mt-4 text-xs text-gray-400">Balance due by {formatDate(trip.balanceDueDate)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            {modalStep === 'form' && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold" style={{ color: '#1e7575' }}>Join This Trip</h2>
                  <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                {!user ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">You need to be signed in to book a trip.</p>
                    <div className="flex gap-3 justify-center">
                      <Link to="/login" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg font-semibold text-white text-sm" style={{ backgroundColor: '#24b3b3' }}>Sign In</Link>
                      <Link to="/register" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg font-semibold border text-sm" style={{ borderColor: '#24b3b3', color: '#24b3b3' }}>Create Account</Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setModalStep('vibe'); }} className="space-y-4">
                    {modalError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{modalError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleFormChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleFormChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone (M-Pesa number)</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} required placeholder="07XXXXXXXX" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Option</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50" style={{ borderColor: formData.paymentType === 'deposit' ? '#ffb347' : '#e5e7eb' }}>
                          <input type="radio" name="paymentType" value="deposit" checked={formData.paymentType === 'deposit'} onChange={handleFormChange} className="radio radio-sm" />
                          <div>
                            <p className="font-medium text-sm">Pay Deposit</p>
                            <p className="text-xs text-gray-500">KES {trip.depositAmount?.toLocaleString()} now</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50" style={{ borderColor: formData.paymentType === 'full' ? '#ffb347' : '#e5e7eb' }}>
                          <input type="radio" name="paymentType" value="full" checked={formData.paymentType === 'full'} onChange={handleFormChange} className="radio radio-sm" />
                          <div>
                            <p className="font-medium text-sm">Pay Full Amount</p>
                            <p className="text-xs text-gray-500">KES {trip.fullPrice?.toLocaleString()}</p>
                          </div>
                        </label>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-lg" style={{ backgroundColor: '#ffb347' }}>
                      Next: Tell Us Your Vibe →
                    </button>
                  </form>
                )}
              </>
            )}

            {/* FEATURE 2: Travel Vibe Selector */}
            {modalStep === 'vibe' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold" style={{ color: '#1e7575' }}>Tell Us Your Vibe</h2>
                  <button onClick={() => setModalStep('form')} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">←</button>
                </div>
                <TravelVibeSelector onComplete={handleVibeComplete} />
              </div>
            )}

            {modalStep === 'payment' && (
              <form onSubmit={handlePaySubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold" style={{ color: '#1e7575' }}>Ready to Pay?</h2>
                  <button onClick={() => setModalStep('vibe')} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">←</button>
                </div>

                {modalError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{modalError}</div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-semibold mb-2">✓ Your Vibe Profile:</p>
                  <p className="mb-1"><strong>Personalities:</strong> {formData.travelPersonalities.join(', ')}</p>
                  <p><strong>Traveling as:</strong> {formData.travelGroup}</p>
                </div>

                <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-lg" style={{ backgroundColor: '#ffb347' }}>
                  Proceed to Payment 💳
                </button>
              </form>
            )}

            {modalStep === 'processing' && (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">📱</div>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#1e7575' }}>Check Your Phone</h2>
                <p className="text-gray-600 text-sm mb-4">An M-Pesa payment prompt has been sent to your phone. Enter your PIN to complete payment.</p>
                <div className="flex justify-center">
                  <span className="loading loading-spinner loading-md" style={{ color: '#24b3b3' }}></span>
                </div>
                <p className="text-xs text-gray-400 mt-4">Waiting for confirmation...</p>
              </div>
            )}

            {modalStep === 'success' && bookingData && (
              <div className="text-center py-6 space-y-6">
                <div className="text-5xl mb-4">🎉</div>
                <div>
                  <h2 className="text-xl font-bold mb-2 text-green-700">Booking Confirmed!</h2>
                  <p className="text-gray-600 text-sm">Your payment was successful. You're officially on this trip!</p>
                </div>

                {/* FEATURE 3: E-Card Preview */}
                <ECardPreview booking={bookingData} trip={trip} user={user} />

                <button
                  onClick={() => { setModalOpen(false); navigate('/my-trips'); }}
                  className="w-full px-6 py-3 rounded-xl font-bold text-white"
                  style={{ backgroundColor: '#24b3b3' }}
                >
                  View My Trips
                </button>
              </div>
            )}

            {modalStep === 'error' && (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-xl font-bold mb-2 text-red-600">Payment Failed</h2>
                <p className="text-gray-600 text-sm mb-6">{modalError || 'Something went wrong. Please try again.'}</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setModalStep('form'); setModalError(''); }} className="px-5 py-2.5 rounded-lg font-semibold text-white" style={{ backgroundColor: '#24b3b3' }}>Try Again</button>
                  <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg font-semibold border border-gray-300 text-gray-600">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}