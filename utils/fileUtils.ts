
import type { ImageData } from '../types';

const MAX_IMAGE_DIMENSION = 1024; // Max width or height in pixels
const JPEG_WEBP_QUALITY = 0.8; // Compression quality for JPEG/WEBP

/**
 * Resizes and compresses an image file.
 * @param file The image file to process.
 * @returns A Promise resolving to an ImageData object with base64 and mimeType.
 */
export const fileToBase64 = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round(height * (MAX_IMAGE_DIMENSION / width));
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round(width * (MAX_IMAGE_DIMENSION / height));
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output MIME type: prefer image/jpeg for compression, fallback to original if PNG/WEBP
        let outputMimeType = 'image/jpeg';
        if (file.type === 'image/png') {
          outputMimeType = 'image/png'; // Keep PNG for transparency if source was PNG
        } else if (file.type === 'image/webp') {
          outputMimeType = 'image/webp';
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Failed to create image blob.'));
            }
            const blobReader = new FileReader();
            blobReader.onloadend = () => {
              if (typeof blobReader.result === 'string') {
                resolve({
                  base64: blobReader.result,
                  mimeType: outputMimeType,
                });
              } else {
                reject(new Error('Failed to read blob as a base64 string.'));
              }
            };
            blobReader.onerror = (error) => reject(error);
            blobReader.readAsDataURL(blob);
          },
          outputMimeType,
          JPEG_WEBP_QUALITY,
        );
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
