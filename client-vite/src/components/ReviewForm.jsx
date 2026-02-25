import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a review.');
      return;
    }
    if (!rating || !text.trim()) {
      setError('Please provide a star rating and review text.');
      return;
    }
    setError('');
    onSubmit({
      rating,
      text,
      userId: user._id,
      userName: user.name,
      date: new Date().toISOString().split('T')[0],
    });
    setRating(0);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 shadow-md my-4">
      <p className="font-bold mb-2" style={{ color: '#24b3b3' }}>Your Rating:</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="text-3xl"
            style={{ color: star <= rating ? '#ffb347' : '#ddd' }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="w-full border border-gray-300 rounded-lg p-3 text-base min-h-[80px] bg-gray-50 mb-2 focus:outline-none focus:ring-2"
        style={{ focusRingColor: '#24b3b3' }}
        placeholder="Write your review..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        type="submit"
        className="w-full text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#24b3b3' }}
      >
        Submit Review
      </button>
    </form>
  );
}