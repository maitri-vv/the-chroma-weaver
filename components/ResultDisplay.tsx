import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
  generatedImage: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ generatedImage }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center aspect-w-1 aspect-h-1">
      <h2 className="text-xl font-semibold text-gray-300 mb-4">Woven Result</h2>
      <div className="w-full h-64 border-2 border-gray-700 bg-gray-900 rounded-lg flex items-center justify-center relative">
        {generatedImage ? (
          <>
            <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain rounded-lg p-1" />
            <a
              href={generatedImage}
              download="chroma-weaver-result.jpeg"
              className="absolute top-2 right-2 bg-gray-900/50 hover:bg-purple-600/80 text-white p-2 rounded-full transition-colors duration-200"
              title="Download Image"
              aria-label="Download Image"
            >
              <DownloadIcon className="w-5 h-5" />
            </a>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <SparklesIcon className="w-12 h-12 mx-auto text-purple-400" />
            <p className="mt-2">Your masterpiece will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;