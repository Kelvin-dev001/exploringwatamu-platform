const axios = require('axios');

/**
 * Generate a shareable e-card image URL for Instagram
 * Uses an external service like DiceBear or a custom image generation endpoint
 */
exports.generateECardUrl = async (booking, trip, user) => {
  try {
    // Example: Use a simple image generation service or template
    // For MVP, we'll return a basic URL structure that the frontend will use to generate the card
    
    const personalitiesText = booking.travelPersonalities.join(', ');
    const encodedText = encodeURIComponent(`${user.name}\n${personalitiesText}`);
    
    // Placeholder: This could be replaced with a call to an image generation service
    const eCardUrl = `${process.env.FRONTEND_URL}/ecard/${booking._id}`;
    
    return eCardUrl;
  } catch (err) {
    console.error('E-card generation error:', err);
    return null;
  }
};

/**
 * Generate shareable text for social media
 */
exports.generateShareableText = (trip, user, personalities) => {
  const personalitiesText = personalities.join(' + ');
  
  return `🎉 IT'S OFFICIAL!\nI'm joining the ${trip.title} on ${new Date(trip.startDate).toLocaleDateString('en-KE')} with @ExploringWatamu\n\nMy travel personality: ${personalitiesText}\n\nWho's joining me?`;
};