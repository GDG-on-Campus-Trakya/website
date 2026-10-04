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
    fileTooLarge: "Fotoğraf 10 MB'tan küçük olmalı.",
    invalidType: "JPEG, PNG, WebP ya da HEIC bir fotoğraf seç.",
    unauthorized: "Fotoğraf yüklenemedi (izin hatası). Destek talebi açarsan bakarız.",
    unknown: "Fotoğraf yüklenemedi. Bağlantını kontrol edip yeniden dene.",
    generic: "Fotoğraf yüklenemedi. Yeniden dene.",
    title: "Profil fotoğrafını değiştir",
  },
  en: {
    fileTooLarge: "The photo must be smaller than 10 MB.",
    invalidType: "Choose a JPEG, PNG, WebP or HEIC photo.",
    unauthorized: "The photo was not uploaded (permission error). Open a support request and we will look into it.",
    unknown: "The photo was not uploaded. Check your connection and try again.",
    generic: "The photo was not uploaded. Try again.",
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
      // The new photo appearing is the confirmation.
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
