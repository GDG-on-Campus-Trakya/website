"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ImageIcon } from "lucide-react";
import { socialUtils } from "../utils/socialUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { logger } from "@/utils/logger";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";

export default function PostUpload({ onUploadComplete, onCancel }) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          invalidImage: "Please select a valid image file.",
          fileTooLarge: "Image size must be smaller than 10MB.",
          selected: "Image selected.",
          previewError: "Failed to preview the image.",
          uploadError: "Failed to upload the image.",
          signInRequired: "You need to sign in.",
          selectImage: "Please select an image.",
          selectEvent: "Please select an event.",
          createPostError: "Failed to create the post.",
          success: "Post shared successfully.",
          unexpectedError: "An unexpected error occurred.",
          title: "New Post",
          selectOrDrag: "Select or drag an image",
          fileHelp: "JPG, PNG, HEIC (Max 10MB - Auto compressed)",
          eventSelection: "Event Selection *",
          chooseEvent: "Select an event",
          expired: "(Expired)",
          raffleHelp: "This post will automatically enter the raffle.",
          noActiveEvents:
            "There are no active events you can share photos for right now.",
          description: "Description (Optional)",
          descriptionPlaceholder: "Write something about your post...",
          sharing: "Sharing...",
          share: "Share",
        }
      : {
          invalidImage: "Lütfen geçerli bir resim dosyası seçin!",
          fileTooLarge: "Resim boyutu 10MB'dan küçük olmalıdır!",
          selected: "Resim seçildi!",
          previewError: "Resim önizlenirken hata oluştu!",
          uploadError: "Resim yüklenirken hata oluştu!",
          signInRequired: "Giriş yapmanız gerekiyor!",
          selectImage: "Lütfen bir resim seçin!",
          selectEvent: "Lütfen bir etkinlik seçin!",
          createPostError: "Post oluşturulurken hata oluştu!",
          success: "Post başarıyla paylaşıldı!",
          unexpectedError: "Beklenmeyen bir hata oluştu!",
          title: "Yeni Post",
          selectOrDrag: "Resim seç veya sürükle",
          fileHelp: "JPG, PNG, HEIC (Max 10MB - Otomatik sıkıştırılır)",
          eventSelection: "Etkinlik Seçimi *",
          chooseEvent: "Etkinlik seçin",
          expired: "(Süresi dolmuş)",
          raffleHelp: "Bu post çekilişe otomatik katılacak!",
          noActiveEvents:
            "Şu anda fotoğraf paylaşabileceğiniz aktif etkinlik yok.",
          description: "Açıklama (İsteğe Bağlı)",
          descriptionPlaceholder: "Postunuz hakkında bir şeyler yazın...",
          sharing: "Paylaşılıyor...",
          share: "Paylaş",
        };

  const [user] = useAuthState(auth);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [activeEvents, setActiveEvents] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadActiveEvents();
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserProfileData(userDoc.data());
      }
    } catch (error) {
      logger.error("Error loading user profile:", error);
    }
  };

  const loadActiveEvents = async () => {
    const result = await socialUtils.getActiveEventsForPosting();
    if (result.success) {
      setActiveEvents(result.events);
    }
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(copy.invalidImage);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(copy.fileTooLarge);
      return;
    }

    try {
      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        toast.success(copy.selected);
      };
      reader.onerror = () => {
        toast.error(copy.previewError);
        setSelectedImage(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(copy.uploadError);
      logger.error("Image select error:", error);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleImageSelect({ target: { files: [file] } });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(copy.signInRequired);
      return;
    }

    if (!selectedImage) {
      toast.error(copy.selectImage);
      return;
    }

    if (!selectedEvent) {
      toast.error(copy.selectEvent);
      return;
    }

    setIsUploading(true);

    try {
      const uploadResult = await socialUtils.uploadPostImage(
        selectedImage,
        user.uid
      );

      if (!uploadResult.success) {
        toast.error(copy.uploadError);
        setIsUploading(false);
        return;
      }

      const eventData = activeEvents.find((event) => event.id === selectedEvent);
      const postData = {
        userId: user.uid,
        userEmail: user.email,
        userName: userProfileData?.name || user.displayName || user.email,
        userPhoto: userProfileData?.photoURL || user.photoURL || null,
        imageUrl: uploadResult.url,
        description: description.trim(),
        eventId: selectedEvent,
        eventName: eventData?.name,
        eventNameEn: eventData?.nameEn || "",
      };

      const postResult = await socialUtils.createPost(postData);

      if (!postResult.success) {
        toast.error(copy.createPostError);
        setIsUploading(false);
        return;
      }

      await socialUtils.addToRaffle(selectedEvent, user.uid, postResult.id);

      toast.success(copy.success);
      setSelectedImage(null);
      setImagePreview(null);
      setDescription("");
      setSelectedEvent("");

      onUploadComplete && onUploadComplete();
    } catch (error) {
      logger.error("Upload error:", error);
      toast.error(copy.unexpectedError);
    }

    setIsUploading(false);
  };

  return (
    <div className="relative mx-auto rounded-xl bg-gray-800/50 backdrop-blur-sm p-6 max-w-lg shadow-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{copy.title}</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {!imagePreview ? (
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[#d1d1e0] text-lg mb-2">{copy.selectOrDrag}</p>
              <p className="text-gray-400 text-sm">{copy.fileHelp}</p>
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
                width={400}
                height={300}
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {copy.eventSelection}
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{copy.chooseEvent}</option>
            {activeEvents.map((event) => (
              <option key={event.id} value={event.id} disabled={!event.canPost}>
                {getLocalizedField(event, "name", locale)}{" "}
                {!event.canPost && copy.expired}
              </option>
            ))}
          </select>
          {selectedEvent && (
            <p className="text-green-400 text-xs mt-1 flex items-center">
              {copy.raffleHelp}
            </p>
          )}
          {activeEvents.length === 0 && (
            <p className="text-yellow-400 text-xs mt-2">{copy.noActiveEvents}</p>
          )}
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">
            {copy.description}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={copy.descriptionPlaceholder}
            rows={3}
            maxLength={500}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isUploading ? copy.sharing : copy.share}
        </button>
      </form>
    </div>
  );
}
