/**
 * Utility to compress and resize image files client-side before storage.
 * Keeps wound photos lightweight (< 200KB) while maintaining clinical sharpness.
 *
 * @param {File} file - The uploaded image file
 * @param {number} maxWidth - Maximum width in pixels (default 1280)
 * @param {number} maxHeight - Maximum height in pixels (default 1280)
 * @param {number} quality - JPEG compression quality 0.0 to 1.0 (default 0.75)
 * @returns {Promise<string>} - Resolves to compressed base64 data URL
 */
export const compressImage = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Die ausgewählte Datei ist kein gültiges Bild.'));
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(readerEvent.target.result); // Fallback to raw data if canvas fails
        }

        // Fill white background in case image has transparency (PNG -> JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export compressed JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = readerEvent.target.result;
    };

    reader.readAsDataURL(file);
  });
};
