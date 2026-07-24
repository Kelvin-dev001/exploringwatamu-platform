import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#fbeec1' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#24b3b3' }}>Reset your password</h1>
        <p className="text-center text-gray-500 text-sm mb-6">We'll email you a reset link.</p>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">📧</div>
            <p className="text-gray-600 text-sm mb-6">
              If an account exists for <strong>{email}</strong>, a password reset link is on its way. Check your inbox.
            </p>
            <Link to="/login" className="font-semibold" style={{ color: '#24b3b3' }}>Back to sign in</Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#24b3b3' }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-5">
              <Link to="/login" className="font-semibold" style={{ color: '#24b3b3' }}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
