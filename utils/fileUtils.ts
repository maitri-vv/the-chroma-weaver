
import type { ImageData } from '../types';

export const fileToBase64 = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1024; // Compress to max 1024px
        let { width, height } = img;
        
        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Export as heavily compressed JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({
          base64: dataUrl,
          mimeType: 'image/jpeg' // Always output jpeg to save space
        });
      };
      img.onerror = () => reject(new Error('Failed to parse image for compression.'));
    };
    reader.onerror = error => reject(error);
  });
};
