
import React, { useRef, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  title: string;
  onImageUpload: (file: File) => void;
  imagePreview: string | null | undefined;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload, imagePreview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  }, [onImageUpload]);


  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center aspect-w-1 aspect-h-1">
      <h2 className="text-xl font-semibold text-gray-300 mb-4">{title}</h2>
      <div 
        className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-700/50 transition-all duration-300 relative"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg p-1" />
        ) : (
          <div className="text-center text-gray-500">
            <UploadIcon className="w-12 h-12 mx-auto" />
            <p className="mt-2">Click to upload or drag & drop</p>
            <p className="text-xs">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
