import React from 'react';

export const ShortsLoader: React.FC = () => {
  return (
    <div className="w-full h-full relative bg-gray-900 animate-pulse flex items-center justify-center overflow-hidden">
      {/* Background skeleton */}
      <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
      
      {/* UI Elements overlay skeleton */}
      <div className="absolute bottom-0 start-0 end-0 p-4 pb-20 flex flex-col justify-end">
        <div className="flex justify-between items-end">
          {/* Info section */}
          <div className="flex-1 pe-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 mb-4"></div>
            <div className="h-4 w-32 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 w-48 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 w-40 bg-gray-700 rounded"></div>
          </div>
          
          {/* Actions section */}
          <div className="flex flex-col items-center space-y-6 pb-4">
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
