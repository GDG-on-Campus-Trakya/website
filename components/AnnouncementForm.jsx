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

export default function AnnouncementForm({ announcement = null, onClose, onSuccess }) {
  const locale = useLocale();
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const fileInputRef = useRef(null);
  const copy =
    locale === "en"
      ? {
          englishTitle: "English Title",
          englishDescription: "English Short Description",
          englishContent: "English Content",
          englishTitlePlaceholder: "Announcement title in English...",
          englishDescriptionPlaceholder:
            "A short English description for the announcement...",
          englishContentPlaceholder:
            "Write the English announcement content here...",
        }
      : {
          englishTitle: "İngilizce Başlık",
          englishDescription: "İngilizce Kısa Açıklama",
          englishContent: "İngilizce İçerik",
          englishTitlePlaceholder: "Duyurunun İngilizce başlığı...",
          englishDescriptionPlaceholder:
            "Duyurunun İngilizce kısa açıklaması...",
          englishContentPlaceholder:
            "Duyurunun İngilizce içeriğini buraya yazın...",
        };

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
      toast.error("Lütfen geçerli bir resim dosyası seçin!");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resim boyutu 10MB'dan küçük olmalıdır!");
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
      toast.error("Giriş yapmanız gerekiyor!");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Lütfen bir başlık girin!");
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
          toast.error("Resim yüklenirken hata oluştu!");
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
        toast.success(result.message);
        onSuccess && onSuccess();
        onClose && onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logger.error("Form submission error:", error);
      toast.error("Beklenmeyen bir hata oluştu!");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-start sm:items-center justify-center overflow-y-auto">
      <div className="relative bg-gray-800/95 backdrop-blur-md rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border border-gray-700 min-h-screen sm:min-h-0 sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-gray-800/95 backdrop-blur-md pb-3 sm:pb-0 sm:static z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {announcement ? "Duyuruyu Düzenle" : "Yeni Duyuru Oluştur"}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 -mr-2"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Title */}
          <div>
            <label className="block text-white text-sm font-medium mb-1.5 sm:mb-2">
              Başlık *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Duyuru başlığı..."
              required
              maxLength={200}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-400 text-xs mt-1">
              {formData.title.length}/200 karakter
            </p>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-1.5 sm:mb-2">
              {copy.englishTitle}
            </label>
            <input
              type="text"
              name="titleEn"
              value={formData.titleEn}
              onChange={handleInputChange}
              placeholder={copy.englishTitlePlaceholder}
              maxLength={200}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white text-sm font-medium mb-1.5 sm:mb-2">
              Kısa Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Duyuru hakkında kısa bir açıklama..."
              rows={2}
              maxLength={300}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-gray-400 text-xs mt-1">
              {formData.description.length}/300 karakter
            </p>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-1.5 sm:mb-2">
              {copy.englishDescription}
            </label>
            <textarea
              name="descriptionEn"
              value={formData.descriptionEn}
              onChange={handleInputChange}
              placeholder={copy.englishDescriptionPlaceholder}
              rows={2}
              maxLength={300}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-white text-sm font-medium mb-1.5 sm:mb-2">
              İçerik
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Duyuru içeriğini buraya yazın..."
              rows={5}
              maxLength={5000}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-gray-400 text-xs mt-1">
              {formData.content.length}/5000 karakter
            </p>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-1.5 sm:mb-2">
              {copy.englishContent}
            </label>
            <textarea
              name="contentEn"
              value={formData.contentEn}
              onChange={handleInputChange}
              placeholder={copy.englishContentPlaceholder}
              rows={5}
              maxLength={5000}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-white text-sm font-medium mb-1.5 sm:mb-2">
              Resim (İsteğe Bağlı)
            </label>
            {!imagePreview ? (
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-300 text-base sm:text-lg mb-1 sm:mb-2">
                  Resim seç veya sürükle
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  JPG, PNG, HEIC (Max 10MB)
                </p>
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
                  className="w-full h-48 sm:h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={selectedImage ? clearImage : removeExistingImage}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 sm:p-2 hover:bg-red-700 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Publish Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
              className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublished" className="text-white text-sm">
              Duyuruyu hemen yayınla
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 pb-4 sm:pb-0 sticky sm:static bottom-0 bg-gray-800/95 backdrop-blur-md -mx-4 sm:mx-0 px-4 sm:px-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                İptal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{announcement ? "Güncelle" : "Oluştur"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
