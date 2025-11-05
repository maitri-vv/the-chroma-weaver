
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Weaving the threads of reality...",
  "Blending vibrant palettes...",
  "Casting realistic shadows...",
  "Fusing styles with AI magic...",
  "Perfecting the final composition...",
  "Holding the pose, adjusting the light...",
  "This can take a moment, artistry needs patience."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
      <p className="text-white text-lg mt-6 font-semibold transition-opacity duration-500">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;
