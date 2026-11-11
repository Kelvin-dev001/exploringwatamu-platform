import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '@/i18n';
import messages from '@/locales/groupTrips';

export default function ReferralCard() {
  const { t, formatKES } = useI18n(messages);
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
        <span className="loading loading-spinner loading-sm" style={{ color: '#02a8ab' }}></span>
      </div>
    );
  }

  if (!referralStats) {
    return null;
  }

  const safariPoints = referralStats.user?.safariPoints || 0;
  const referralsCount = referralStats.user?.referralsCount || 0;

  return (
    <div className="bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(135deg, #02a8ab 0%, #1db6b9 100%)' }}>
      <div className="rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t('pointsTitle')}</h3>
          <div className="badge badge-lg" style={{ backgroundColor: '#e06c31', color: '#215a75', borderColor: '#e06c31' }}>
            {t('points', { count: safariPoints })}
          </div>
        </div>

        <p className="text-sm mb-4 text-white/90">
          {t('pointsIntro')}
        </p>

        {/* Referral Link */}
        <div className="bg-white/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-white/70 mb-1">{t('yourLink')}</p>
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
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold">{referralsCount}</p>
            <p className="text-xs text-white/70">{t('referrals')}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold">{Math.floor(safariPoints / 100)}</p>
            <p className="text-xs text-white/70">{t('discounted')}</p>
          </div>
        </div>

        <p className="text-xs text-white/60 mt-4 text-center">
          {t('pointsTip', { amount: formatKES(1000) })}
        </p>
      </div>
    </div>
  );
}