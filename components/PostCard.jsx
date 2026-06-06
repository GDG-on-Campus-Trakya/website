"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, User } from "lucide-react";
import { socialUtils } from "../utils/socialUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { logger } from "@/utils/logger";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

export default function PostCard({
  post,
  onPostClick,
  onDelete,
  showAdminActions = false,
}) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          likeError: "Like action failed.",
          confirmDelete: "Are you sure you want to delete this post?",
          deleteSuccess: "Post deleted successfully.",
          deleteError: "Failed to delete the post.",
          shown: "Post is now visible.",
          hidden: "Post hidden.",
          actionError: "Action failed.",
          show: "Show",
          hide: "Hide",
          delete: "Delete",
          hiddenPost: "This post is hidden",
        }
      : {
          likeError: "Beğeni işlemi başarısız!",
          confirmDelete: "Bu postu silmek istediğinizden emin misiniz?",
          deleteSuccess: "Post başarıyla silindi!",
          deleteError: "Post silinirken hata oluştu!",
          shown: "Post gösterildi!",
          hidden: "Post gizlendi!",
          actionError: "İşlem başarısız!",
          show: "Göster",
          hide: "Gizle",
          delete: "Sil",
          hiddenPost: "Bu post gizlenmiş",
        };

  const [user] = useAuthState(auth);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [postUserProfile, setPostUserProfile] = useState(null);

  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.includes(user.uid));
    }
  }, [user, post.likes]);

  useEffect(() => {
    const loadPostUserProfile = async () => {
      if (
        post.userId &&
        (!post.userPhoto || post.userPhoto.includes("googleusercontent.com"))
      ) {
        try {
          const userDoc = await getDoc(doc(db, "users", post.userId));
          if (userDoc.exists()) {
            setPostUserProfile(userDoc.data());
          }
        } catch (error) {
          logger.error("Error loading post user profile:", error);
        }
      }
    };

    loadPostUserProfile();
  }, [post.userId, post.userPhoto]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user || isLiking) return;

    setIsLiking(true);
    const result = await socialUtils.likePost(post.id, user.uid);

    if (result.success) {
      setIsLiked(result.action === "liked");
      setLikeCount((prev) => (result.action === "liked" ? prev + 1 : prev - 1));
    } else {
      toast.error(copy.likeError);
    }
    setIsLiking(false);
  };

  const handleDelete = async () => {
    if (!confirm(copy.confirmDelete)) return;

    const result = await socialUtils.deletePost(post.id);
    if (result.success) {
      toast.success(copy.deleteSuccess);
      onDelete && onDelete(post.id);
    } else {
      toast.error(copy.deleteError);
    }
  };

  const handleHide = async () => {
    const result = await socialUtils.hidePost(post.id, !post.isHidden);
    if (result.success) {
      toast.success(post.isHidden ? copy.shown : copy.hidden);
      onDelete && onDelete(post.id);
    } else {
      toast.error(copy.actionError);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatLocalizedDate(date, locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const eventName =
    getLocalizedField(post, "eventName", locale) ||
    post.eventNameEn ||
    post.eventName;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden max-w-full">
      <div className="flex items-center justify-between p-4 gap-2">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-pink-500">
            {(() => {
              const profilePhoto =
                postUserProfile?.photoURL ||
                post.userPhoto ||
                (post.userId === user?.uid && user?.photoURL);

              if (profilePhoto) {
                return (
                  <Image
                    src={profilePhoto}
                    alt={
                      postUserProfile?.name || post.userName || post.userEmail
                    }
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                );
              }

              return (
                <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              );
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="max-w-full">
              <h3 className="text-white font-semibold text-sm break-words">
                {postUserProfile?.name ||
                  post.userName ||
                  post.userEmail?.split("@")[0]}
              </h3>
              {eventName && (
                <p className="text-blue-400 text-xs break-words">
                  • {eventName}
                </p>
              )}
            </div>
            <p className="text-gray-400 text-xs">{formatDate(post.timestamp)}</p>
          </div>
        </div>

        {showAdminActions && (
          <div className="flex space-x-1">
            <button
              onClick={handleHide}
              className={`px-3 py-1 rounded-full text-xs ${
                post.isHidden
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}
            >
              {post.isHidden ? copy.show : copy.hide}
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-3 py-1 rounded-full text-xs hover:bg-red-700"
            >
              {copy.delete}
            </button>
          </div>
        )}
      </div>

      <div
        className="relative cursor-pointer max-w-full overflow-hidden"
        onClick={() => onPostClick && onPostClick(post)}
      >
        <Image
          src={post.imageUrl}
          alt={post.description || "Post image"}
          width={600}
          height={400}
          className="w-full h-64 sm:h-80 lg:h-96 object-cover hover:opacity-95 transition-opacity max-w-full"
          priority={false}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />

        {post.isHidden && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <span className="text-white font-semibold">{copy.hiddenPost}</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>

            <button
              onClick={() => onPostClick && onPostClick(post)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">{post.commentCount || 0}</span>
            </button>
          </div>

          {post.isAdminPost && (
            <div className="bg-green-600 px-2 py-1 rounded-full">
              <span className="text-white text-xs font-medium">Admin</span>
            </div>
          )}
        </div>

        {post.description && (
          <div className="text-[#d1d1e0] text-sm leading-relaxed">
            <span className="font-semibold text-white">
              {post.userName || post.userEmail}
            </span>{" "}
            {post.description}
          </div>
        )}
      </div>
    </div>
  );
}
