import React from 'react';

export default function LoadingSpinner({ loading }) {
  if (!loading) return null;
  return (
    <div className="flex justify-center py-16">
      <div
        className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#24b3b3', borderTopColor: 'transparent' }}
      ></div>
    </div>
  );
}