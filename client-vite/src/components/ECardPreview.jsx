import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

export default function ECardPreview({ booking, trip, user }) {
  const [downloading, setDownloading] = useState(false);
  const eCardRef = useRef(null);

  const personalityEmojis = {
    'Party Starter': '🎉',
    'Social Butterfly': '🦋',
    'Chill Connector': '😎',
    'Reserved Explorer': '🌿',
    'Music Lover': '🎧',
    'Storyteller': '📖',
    'Jokester': '😂',
    'Deep Talker': '🎙️',
    'Adrenaline Junkie': '⚡',
    'Photography Lover': '📸',
    'Nature Nerd': '🌴',
    'Foodie Explorer': '🍲',
    'Beach Bum': '🏖️',
  };

  const personalityText = booking.travelPersonalities
    ?.map(p => `${personalityEmojis[p] || '✨'} ${p}`)
    .join('\n') || 'Travel Lover';

  const startDate = new Date(trip.startDate).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
  });
  const endDate = new Date(trip.endDate).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const downloadECard = async () => {
    setDownloading(true);
    try {
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
      alert('Failed to download e-card');
    } finally {
      setDownloading(false);
    }
  };

  const shareText = `🎉 IT'S OFFICIAL! I'm joining the ${trip.title} on ${startDate}-${endDate} with @ExploringWatamu\n\nMy travel personality: ${personalityText.replace(/\n/g, ' + ')}\n\nWho's joining me? exploringwatamu.vercel.app/group-trips/${trip.slug}`;

  const shareToWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const shareToInstagram = () => {
    // Copy to clipboard for Instagram Stories/Post
    navigator.clipboard.writeText(shareText);
    alert('Text copied! Paste it in your Instagram caption 📸');
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/group-trips/${trip.slug}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied!');
  };

  return (
    <div className="space-y-4">
      {/* E-Card Preview */}
      <div
        ref={eCardRef}
        className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #24b3b3 0%, #46c3d6 40%, #fbeec1 100%)',
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
            <p className="text-white font-bold text-sm mb-2">My Travel Vibe:</p>
            <p
              className="text-white text-sm font-semibold whitespace-pre-line"
              style={{ lineHeight: '1.6' }}
            >
              {personalityText}
            </p>
          </div>

          <p className="text-white text-sm font-semibold">🎉 IT'S OFFICIAL!</p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white text-xs font-bold">
            {user.name.toUpperCase()} IS GOING
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
          style={{ backgroundColor: '#ffb347' }}
        >
          {downloading ? '⏳ Downloading...' : '⬇️ Download for Instagram'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={shareToWhatsApp}
            className="py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            💬 Share to WhatsApp
          </button>
          <button
            onClick={shareToInstagram}
            className="py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E4405F' }}
          >
            📸 Share to Instagram
          </button>
        </div>

        <button
          onClick={copyShareLink}
          className="w-full py-2.5 rounded-lg font-semibold border-2 text-sm transition-colors hover:bg-gray-50"
          style={{ borderColor: '#24b3b3', color: '#24b3b3' }}
        >
          🔗 Copy Referral Link
        </button>
      </div>
    </div>
  );
}