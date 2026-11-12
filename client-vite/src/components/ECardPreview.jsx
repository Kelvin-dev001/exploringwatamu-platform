import React, { useState, useRef } from 'react';
import { formatDay } from '@/lib/utils';
import { absoluteUrl } from '@/lib/site';
import { localisePath, useI18n } from '@/i18n';
import messages from '@/locales/groupTrips';
import { personaEmoji, useVibeWords } from '@/lib/travelVibes';

export default function ECardPreview({ booking, trip, user }) {
  const { t, locale } = useI18n(messages);
  const { personaLabel } = useVibeWords();
  const [downloading, setDownloading] = useState(false);
  const eCardRef = useRef(null);

  const personalityText = booking.travelPersonalities
    ?.map((p) => `${personaEmoji(p)} ${personaLabel(p)}`)
    .join('\n') || t('travelLover');

  const startDate = formatDay(trip.startDate, { month: 'short', day: 'numeric' });
  const endDate = formatDay(trip.endDate, { month: 'short', day: 'numeric', year: 'numeric' });
  const tripLink = absoluteUrl(localisePath(`/group-trips/${trip.slug}`, locale));

  const downloadECard = async () => {
    setDownloading(true);
    try {
      // ~45 KB gzip, only needed for this button: fetched on the first tap.
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(eCardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `watamu-${trip.slug}-${user.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert(t('downloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  const shareText = t('shareText', { trip: trip.title, dates: `${startDate}–${endDate}`, vibe: personalityText.replace(/\n/g, ' + '), link: tripLink });

  const shareToWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const shareToInstagram = () => {
    // Copy to clipboard for Instagram Stories/Post
    navigator.clipboard.writeText(shareText);
    alert(t('copiedInstagram'));
  };

  const copyShareLink = () => {
    const link = `${tripLink}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    alert(t('referralCopied'));
  };

  return (
    <div className="space-y-4">
      {/* E-Card Preview */}
      <div
        ref={eCardRef}
        className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #02a8ab 0%, #1db6b9 40%, #f9e9c4 100%)',
          aspectRatio: '1/1',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-white text-sm font-bold tracking-widest">EXPLORING WATAMU</p>
          <p className="text-white text-2xl font-black mt-1">🌴</p>
        </div>

        {/* Main content */}
        <div className="text-center">
          <h2 className="text-white text-2xl font-black mb-2">{trip.title}</h2>
          <p className="text-white/90 text-xs font-semibold mb-4">
            {startDate} – {endDate}
          </p>

          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm mb-4">
            <p className="text-white font-bold text-sm mb-2">{t('myVibe')}</p>
            <p
              className="text-white text-sm font-semibold whitespace-pre-line"
              style={{ lineHeight: '1.6' }}
            >
              {personalityText}
            </p>
          </div>

          <p className="text-white text-sm font-semibold">{t('official')}</p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white text-xs font-bold">
            {t('isGoing', { name: user.name.toUpperCase() })}
          </p>
          <p className="text-white/70 text-xs mt-1">@ExploringWatamu</p>
        </div>
      </div>

      {/* Share buttons */}
      <div className="space-y-2">
        <button
          onClick={downloadECard}
          disabled={downloading}
          className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#e06c31' }}
        >
          {downloading ? t('downloading') : t('download')}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={shareToWhatsApp}
            className="py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            {t('shareWhatsApp')}
          </button>
          <button
            onClick={shareToInstagram}
            className="py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E4405F' }}
          >
            {t('shareInstagram')}
          </button>
        </div>

        <button
          onClick={copyShareLink}
          className="w-full py-2.5 rounded-lg font-semibold border-2 text-sm transition-colors hover:bg-gray-50"
          style={{ borderColor: '#02a8ab', color: '#02a8ab' }}
        >
          {t('copyReferral')}
        </button>
      </div>
    </div>
  );
}