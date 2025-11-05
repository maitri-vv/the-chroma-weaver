
import type { ImageData } from '../types';

export const fileToBase64 = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({
          base64: reader.result,
          mimeType: file.type
        });
      } else {
        reject(new Error('Failed to read file as a base64 string.'));
      }
    };
    reader.onerror = error => reject(error);
  });
};
