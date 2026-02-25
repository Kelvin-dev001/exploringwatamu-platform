import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ReviewList({ reviews, onEdit, onDelete }) {
  const { user } = useAuth();

  if (!reviews || reviews.length === 0) {
    return <p className="text-gray-400 italic mt-4">No reviews yet. Be the first to review!</p>;
  }

  return (
    <div className="space-y-3 my-4">
      {reviews.map((rev, idx) => (
        <div key={rev._id || idx} className="bg-gray-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-primary text-sm">{rev.userName}</span>
            <span className="text-xs text-gray-500">
              {rev.date || new Date(rev.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-secondary text-base">
            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
          </p>
          <p className="text-gray-700 text-sm mt-1">{rev.text}</p>
          {user && user._id === rev.userId && (
            <div className="flex gap-4 mt-2">
              {onEdit && (
                <button onClick={() => onEdit(rev)} className="text-primary font-bold text-sm">
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(rev._id)} className="text-red-500 font-bold text-sm">
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}