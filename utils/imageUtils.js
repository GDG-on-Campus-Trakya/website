export const compressImage = (file, maxSizeKB = 300, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // More aggressive dimension reduction for compression
      const maxWidth = 800;  // Reduced from 1200
      const maxHeight = 800; // Reduced from 1200
      
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      if (ratio < 1) {
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      
      canvas.width = width;
      canvas.height = height;
      
      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const compress = (currentQuality) => {
        // Always use JPEG for better compression, unless original is PNG with transparency
        let outputType = 'image/jpeg';
        if (file.type === 'image/png') {
          // Check if PNG has transparency
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          let hasTransparency = false;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
              hasTransparency = true;
              break;
            }
          }
          if (!hasTransparency) {
            outputType = 'image/jpeg'; // Convert to JPEG if no transparency
          }
        }
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Resim sıkıştırma başarısız oldu'));
            return;
          }
          
          const sizeKB = blob.size / 1024;
          
          if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
            // Ensure content type is explicitly set
            const fileWithType = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: outputType || 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(fileWithType);
          } else {
            // More aggressive quality reduction
            compress(currentQuality - 0.15);
          }
        }, outputType || 'image/jpeg', currentQuality);
      };
      
      compress(quality);
    };
    
    img.onerror = () => {
      reject(new Error('Resim yüklenemedi'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const validateImageFile = (file, returnObject = false) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const maxSizeMB = 10;

  // Check file type
  if (!validTypes.includes(file.type)) {
    const error = 'Sadece JPEG, PNG ve WebP formatları desteklenir.';
    if (returnObject) {
      return { valid: false, error };
    }
    throw new Error(error);
  }

  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    const error = `Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır.`;
    if (returnObject) {
      return { valid: false, error };
    }
    throw new Error(error);
  }

  return returnObject ? { valid: true } : true;
};

export const generateFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${prefix}${timestamp}_${randomId}.${extension}`;
};

// Alias for imageCompression.js compatibility
export const uploadCompressedImage = async (blob, path) => {
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const { storage } = await import('../lib/firebase/storage');

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};