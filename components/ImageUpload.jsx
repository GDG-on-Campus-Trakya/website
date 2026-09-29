"use client";
import { useState, useRef } from 'react';
import { uploadImage } from '../utils/storageUtils';
import { toast } from 'react-toastify';
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";

const ImageUpload = ({ 
  onImageUpload, 
  currentImageUrl = '', 
  folder = 'images', 
  prefix = '',
  className = '',
  placeholder = 'Resim Yükle'
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

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
      
      toast.success('Resim başarıyla yüklendi!');
    } catch (error) {
      logger.error('Resim yükleme hatası:', error);
      toast.error(error.message || 'Resim yüklenirken hata oluştu');
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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={uploading}
        >
          {uploading ? 'Yükleniyor...' : placeholder}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-error"
          >
            Kaldır
          </Button>
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
            alt="Önizleme"
            className="h-32 w-32 rounded bg-paper-2 object-cover"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP, HEIC formatları desteklenir. Maksimum 10MB.
      </p>
    </div>
  );
};

export default ImageUpload;
