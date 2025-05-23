import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-violet-900">
      <div className="relative">
        <div className="w-12 h-12 rounded-full absolute border-4 border-purple-100"></div>
        <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-purple-500 border-t-transparent"></div>
      </div>
    </div>
  );
}
