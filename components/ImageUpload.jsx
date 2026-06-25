"use client";
import { useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { uploadImage } from '../utils/storageUtils';
import { toast } from 'react-toastify';
import { logger } from "@/utils/logger";

const COPY = {
  tr: {
    uploadImage: 'Resim Yükle',
    uploading: 'Yükleniyor...',
    remove: 'Kaldır',
    preview: 'Önizleme',
    uploadSuccess: 'Resim başarıyla yüklendi!',
    uploadError: 'Resim yüklenirken hata oluştu',
    formats: 'JPEG, PNG, WebP, HEIC formatları desteklenir. Maksimum 10MB.',
  },
  en: {
    uploadImage: 'Upload Image',
    uploading: 'Loading...',
    remove: 'Remove',
    preview: 'Preview',
    uploadSuccess: 'Image uploaded successfully!',
    uploadError: 'An error occurred while uploading the image',
    formats: 'JPEG, PNG, WebP, HEIC formats are supported. Maximum 10MB.',
  },
};

const ImageUpload = ({
  onImageUpload,
  currentImageUrl = '',
  folder = 'images',
  prefix = '',
  className = '',
  placeholder
}) => {
  const locale = useLocale() === 'en' ? 'en' : 'tr';
  const copy = COPY[locale];
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);
  const buttonLabel = placeholder || copy.uploadImage;

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);
      
      const result = await uploadImage(file, folder, prefix);
      
      setPreviewUrl(result.url);
      onImageUpload(result);
      
      toast.success(copy.uploadSuccess);
    } catch (error) {
      logger.error('Resim yükleme hatası:', error);
      toast.error(error.message || copy.uploadError);
      setPreviewUrl(currentImageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onImageUpload({ url: '', path: '', fileName: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
        >
          {uploading ? copy.uploading : buttonLabel}
        </button>
        
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            {copy.remove}
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl && (
        <div className="mt-2">
          <img
            src={previewUrl}
            alt={copy.preview}
            className="w-32 h-32 object-cover rounded-md border border-gray-300"
          />
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        {copy.formats}
      </p>
    </div>
  );
};

export default ImageUpload;