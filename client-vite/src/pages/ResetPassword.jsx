import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#fbeec1' }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#24b3b3' }}>Choose a new password</h1>

        {!token ? (
          <p className="text-center text-gray-600 text-sm mt-4">
            This reset link is invalid or missing a token.{' '}
            <Link to="/forgot-password" className="font-semibold" style={{ color: '#24b3b3' }}>Request a new one</Link>.
          </p>
        ) : done ? (
          <div className="text-center mt-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-600 text-sm mb-4">Your password has been reset. Redirecting to sign in…</p>
            <Link to="/login" className="font-semibold" style={{ color: '#24b3b3' }}>Sign in now</Link>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-500 text-sm mb-6">Enter a new password for your account.</p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#24b3b3' }}
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
