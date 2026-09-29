"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { uploadImage } from "../utils/storageUtils";
import { toast } from "react-toastify";
import { logger } from "@/utils/logger";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => !uploading && fileInputRef.current?.click()}
        loading={uploading}
        className="absolute -bottom-2 -right-2 bg-background"
        title={copy.title}
        aria-label={copy.title}
      >
        <Camera />
      </Button>

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
