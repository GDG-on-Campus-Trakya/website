"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { uploadImage } from "../utils/storageUtils";
import { toast } from "react-toastify";
import { logger } from "@/utils/logger";

const COPY = {
  tr: {
    fileTooLarge: "Dosya boyutu 10 MB'dan küçük olmalıdır.",
    invalidType: "Sadece JPEG, PNG, WebP ve HEIC formatları desteklenir.",
    success: "Profil fotoğrafı başarıyla güncellendi!",
    unauthorized: "Firebase Storage izin hatası. Lütfen yöneticiye başvurun.",
    unknown: "Firebase Storage bağlantı hatası. Lütfen tekrar deneyin.",
    generic: "Profil fotoğrafı yüklenirken hata oluştu",
    title: "Profil fotoğrafını değiştir",
  },
  en: {
    fileTooLarge: "The file size must be smaller than 10 MB.",
    invalidType: "Only JPEG, PNG, WebP, and HEIC formats are supported.",
    success: "Profile photo updated successfully.",
    unauthorized: "Firebase Storage permission error. Please contact an administrator.",
    unknown: "Firebase Storage connection error. Please try again.",
    generic: "An error occurred while uploading the profile photo",
    title: "Change profile photo",
  },
};

const ProfileImageUpload = ({
  onImageUpload,
  folder = "profiles",
  prefix = "",
  isEditing = false,
}) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      if (file.size > 10 * 1024 * 1024) {
        throw new Error(copy.fileTooLarge);
      }

      if (
        !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(
          file.type
        )
      ) {
        throw new Error(copy.invalidType);
      }

      const result = await uploadImage(file, folder, prefix);
      onImageUpload(result);
      toast.success(copy.success);
    } catch (uploadError) {
      logger.error("Profile photo upload error:", uploadError);

      if (uploadError.code === "storage/unauthorized") {
        toast.error(copy.unauthorized);
      } else if (uploadError.code === "storage/unknown") {
        toast.error(copy.unknown);
      } else {
        toast.error(uploadError.message || copy.generic);
      }
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  if (!isEditing) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm text-white shadow-lg transition-colors hover:bg-blue-600 disabled:bg-blue-300"
        title={copy.title}
      >
        {uploading ? "⏳" : "📷"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};

export default ProfileImageUpload;
