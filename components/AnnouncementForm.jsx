"use client";
import { useState, useRef, useEffect } from "react";
import { X, Upload, ImageIcon } from "lucide-react";
import { announcementsUtils } from "../utils/announcementsUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { logger } from "@/utils/logger";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const COPY = {
  tr: {
    englishTitle: "İngilizce başlık",
    englishDescription: "İngilizce kısa açıklama",
    englishContent: "İngilizce içerik",
    englishTitlePlaceholder: "Duyurunun İngilizce başlığı…",
    englishDescriptionPlaceholder:
      "Duyurunun İngilizce kısa açıklaması...",
    englishContentPlaceholder:
      "Duyurunun İngilizce içeriğini buraya yazın...",
    invalidImage: "Lütfen geçerli bir resim dosyası seçin.",
    imageTooLarge: "Resim boyutu 10MB'dan küçük olmalıdır.",
    loginRequired: "Giriş yapmanız gerekiyor",
    titleRequired: "Lütfen bir başlık girin.",
    imageUploadError: "Resim yüklenirken hata oluştu.",
    unexpectedError: "Beklenmeyen bir hata oluştu.",
    editTitle: "Duyuruyu düzenle",
    createTitle: "Yeni duyuru oluştur",
    titleLabel: "Başlık",
    titlePlaceholder: "Duyuru başlığı…",
    characters: "karakter",
    descriptionLabel: "Kısa açıklama (isteğe bağlı)",
    descriptionPlaceholder: "Duyuru hakkında kısa bir açıklama…",
    contentLabel: "İçerik",
    contentPlaceholder: "Duyuru içeriğini buraya yazın…",
    imageLabel: "Resim (isteğe bağlı)",
    imageDropHint: "Resim seç veya sürükle",
    publishNow: "Duyuruyu hemen yayınla",
    cancel: "İptal",
    saving: "Kaydediliyor…",
    update: "Güncelle",
    create: "Oluştur",
    createSuccess: "Duyuru başarıyla oluşturuldu",
    createError: "Duyuru oluşturulurken hata oluştu.",
    updateSuccess: "Duyuru başarıyla güncellendi",
    updateError: "Duyuru güncellenirken hata oluştu.",
  },
  en: {
    englishTitle: "English title",
    englishDescription: "English short description",
    englishContent: "English content",
    englishTitlePlaceholder: "Announcement title in English…",
    englishDescriptionPlaceholder:
      "A short English description for the announcement...",
    englishContentPlaceholder:
      "Write the English announcement content here...",
    invalidImage: "Please select a valid image file.",
    imageTooLarge: "Image size must be smaller than 10MB.",
    loginRequired: "You need to sign in.",
    titleRequired: "Please enter a title.",
    imageUploadError: "An error occurred while uploading the image.",
    unexpectedError: "An unexpected error occurred.",
    editTitle: "Edit announcement",
    createTitle: "Create new announcement",
    titleLabel: "Title",
    titlePlaceholder: "Announcement title…",
    characters: "characters",
    descriptionLabel: "Short description (optional)",
    descriptionPlaceholder: "A short description about the announcement…",
    contentLabel: "Content",
    contentPlaceholder: "Write the announcement content here…",
    imageLabel: "Image (optional)",
    imageDropHint: "Select or drag an image",
    publishNow: "Publish immediately",
    cancel: "Cancel",
    saving: "Saving…",
    update: "Update",
    create: "Create",
    createSuccess: "Announcement created successfully",
    createError: "An error occurred while creating the announcement.",
    updateSuccess: "Announcement updated successfully",
    updateError: "An error occurred while updating the announcement.",
  },
};

export default function AnnouncementForm({ announcement = null, onClose, onSuccess }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const fileInputRef = useRef(null);
  const copy = COPY[locale];

  // Form state
  const [formData, setFormData] = useState({
    title: announcement?.title || "",
    titleEn: announcement?.titleEn || "",
    description: announcement?.description || "",
    descriptionEn: announcement?.descriptionEn || "",
    content: announcement?.content || "",
    contentEn: announcement?.contentEn || "",
    isPublished: announcement?.isPublished ?? true,
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(announcement?.imageUrl || null);
  const [existingImageUrl, setExistingImageUrl] = useState(announcement?.imageUrl || null);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      logger.error("Error loading user profile:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(copy.invalidImage);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(copy.imageTooLarge);
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(existingImageUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(copy.loginRequired);
      return;
    }

    if (!formData.title.trim()) {
      toast.error(copy.titleRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = existingImageUrl;
      let imagePath = announcement?.imagePath || null;

      // Upload new image if selected
      if (selectedImage) {
        const uploadResult = await announcementsUtils.uploadAnnouncementImage(
          selectedImage,
          `announcement_${Date.now()}`
        );

        if (!uploadResult.success) {
          toast.error(copy.imageUploadError);
          setIsSubmitting(false);
          return;
        }

        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;
      }

      // Prepare announcement data
      const announcementData = {
        title: formData.title.trim(),
        titleEn: formData.titleEn.trim(),
        description: formData.description.trim(),
        descriptionEn: formData.descriptionEn.trim(),
        content: formData.content.trim(),
        contentEn: formData.contentEn.trim(),
        imageUrl: imageUrl || null,
        imagePath: imagePath || null,
        isPublished: formData.isPublished,
        authorId: user.uid,
        authorEmail: user.email,
        authorName: userProfile?.name || user.displayName || user.email,
      };

      let result;
      if (announcement) {
        // Update existing announcement
        result = await announcementsUtils.updateAnnouncement(
          announcement.id,
          announcementData
        );
      } else {
        // Create new announcement
        result = await announcementsUtils.createAnnouncement(announcementData);
      }

      if (result.success) {
        toast.success(announcement ? copy.updateSuccess : copy.createSuccess);
        onSuccess && onSuccess();
        onClose && onClose();
      } else {
        toast.error(announcement ? copy.updateError : copy.createError);
      }
    } catch (error) {
      logger.error("Form submission error:", error);
      toast.error(copy.unexpectedError);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { onClose?.(); } }}>
      <DialogContent hideClose aria-describedby={undefined} className="max-w-2xl border border-rule bg-background p-4 text-foreground sm:p-6 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-raised -mx-4 mb-4 flex items-center justify-between gap-4 border-b border-rule bg-background px-4 pb-3 sm:static sm:mx-0 sm:mb-6 sm:px-0">
          <DialogTitle className="font-display text-xl font-bold sm:text-2xl">
            {announcement ? copy.editTitle : copy.createTitle}
          </DialogTitle>
          {onClose && (
            <Button type="button" variant="ghost" size="icon" onClick={onClose} className="-mr-2">
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Title */}
          <Field
            id="announcement-title"
            label={copy.titleLabel}
            required
            help={`${formData.title.length}/200 ${copy.characters}`}
          >
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={copy.titlePlaceholder}
              required
              maxLength={200}
            />
          </Field>

          <Field id="announcement-title-en" label={copy.englishTitle}>
            <Input
              type="text"
              name="titleEn"
              value={formData.titleEn}
              onChange={handleInputChange}
              placeholder={copy.englishTitlePlaceholder}
              maxLength={200}
            />
          </Field>

          {/* Description */}
          <Field
            id="announcement-description"
            label={copy.descriptionLabel}
            help={`${formData.description.length}/300 ${copy.characters}`}
          >
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={copy.descriptionPlaceholder}
              rows={2}
              maxLength={300}
              className="resize-none"
            />
          </Field>

          <Field id="announcement-description-en" label={copy.englishDescription}>
            <Textarea
              name="descriptionEn"
              value={formData.descriptionEn}
              onChange={handleInputChange}
              placeholder={copy.englishDescriptionPlaceholder}
              rows={2}
              maxLength={300}
              className="resize-none"
            />
          </Field>

          {/* Content */}
          <Field
            id="announcement-content"
            label={copy.contentLabel}
            help={`${formData.content.length}/5000 ${copy.characters}`}
          >
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder={copy.contentPlaceholder}
              rows={5}
              maxLength={5000}
              className="resize-none"
            />
          </Field>

          <Field id="announcement-content-en" label={copy.englishContent}>
            <Textarea
              name="contentEn"
              value={formData.contentEn}
              onChange={handleInputChange}
              placeholder={copy.englishContentPlaceholder}
              rows={5}
              maxLength={5000}
              className="resize-none"
            />
          </Field>

          {/* Image Upload */}
          <div className="flex flex-col gap-1.5 pb-4">
            <span className="text-sm font-medium leading-none">{copy.imageLabel}</span>
            {!imagePreview ? (
              <div
                className="cursor-pointer rounded border border-dashed border-input p-6 text-center transition-colors duration-micro hover:bg-secondary sm:p-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="mb-1 text-base text-ink">{copy.imageDropHint}</p>
                <p className="text-sm text-muted-foreground">JPG, PNG, HEIC (Max 10MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,image/heic,image/heif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={600}
                  height={400}
                  className="aspect-[16/9] w-full rounded object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={selectedImage ? clearImage : removeExistingImage}
                  className="absolute right-2 top-2 bg-background"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3 pb-2">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
              className="h-5 w-5 shrink-0 accent-brand"
            />
            <label htmlFor="isPublished" className="text-sm">
              {copy.publishNow}
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-rule bg-background px-4 pb-4 pt-3 sm:static sm:mx-0 sm:flex-row sm:gap-3 sm:px-0 sm:pb-0 sm:pt-4">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="order-2 flex-1 sm:order-1"
              >
                {copy.cancel}
              </Button>
            )}
            <Button
              type="submit"
              loading={isSubmitting}
              className="order-1 flex-1 sm:order-2"
            >
              {isSubmitting ? (
                <span>{copy.saving}</span>
              ) : (
                <>
                  <Upload aria-hidden="true" />
                  <span>{announcement ? copy.update : copy.create}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
