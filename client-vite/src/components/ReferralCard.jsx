import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ReferralCard() {
  const { user, token } = useAuth();
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    axios.get(`${API_URL}/referrals/my-referrals`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setReferralStats(res.data))
      .catch(() => console.error('Failed to load referral stats'))
      .finally(() => setLoading(false));
  }, [user, token]);

  const copyReferralLink = () => {
    if (referralStats?.user?.referralLink) {
      navigator.clipboard.writeText(referralStats.user.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <span className="loading loading-spinner loading-sm" style={{ color: '#24b3b3' }}></span>
      </div>
    );
  }

  if (!referralStats) {
    return null;
  }

  const safariPoints = referralStats.user?.safariPoints || 0;
  const referralsCount = referralStats.user?.referralsCount || 0;

  return (
    <div className="bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(135deg, #24b3b3 0%, #46c3d6 100%)' }}>
      <div className="rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">🎫 Safari Points</h3>
          <div className="badge badge-lg" style={{ backgroundColor: '#ffb347', color: '#1e7575', borderColor: '#ffb347' }}>
            {safariPoints} pts
          </div>
        </div>

        <p className="text-sm mb-4 text-white/90">
          Share your referral link and earn 100 points for every friend who joins!
        </p>

        {/* Referral Link */}
        <div className="bg-white/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-white/70 mb-1">Your Referral Link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralStats.user?.referralLink || ''}
              readOnly
              className="flex-1 bg-white/10 text-white text-xs px-2 py-1.5 rounded border border-white/30 focus:outline-none"
            />
            <button
              onClick={copyReferralLink}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold">{referralsCount}</p>
            <p className="text-xs text-white/70">Successful Referrals</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold">{Math.floor(safariPoints / 100)}</p>
            <p className="text-xs text-white/70">Trips Discounted</p>
          </div>
        </div>

        <p className="text-xs text-white/60 mt-4 text-center">
          💡 Tip: 100 points = KES 1,000 off your next trip!
        </p>
      </div>
    </div>
  );
}