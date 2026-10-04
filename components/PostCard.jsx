"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { socialUtils } from "../utils/socialUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
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
          const profile = await socialUtils.getUserProfile(post.userId);
          if (profile) {
            setPostUserProfile(profile);
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
    <article className="max-w-full border-b border-rule py-6">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-rule bg-paper-3">
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
                    className="h-full w-full object-cover"
                  />
                );
              }

              return (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <User className="h-4 w-4" aria-hidden="true" />
                </div>
              );
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="break-words font-sans text-sm font-semibold">
              {postUserProfile?.name ||
                post.userName ||
                post.userEmail?.split("@")[0]}
            </h3>
            {eventName && (
              <p className="break-words text-xs text-ink-2">{eventName}</p>
            )}
            <p className="font-outlier text-xs text-muted-foreground">
              {formatDate(post.timestamp)}
            </p>
          </div>
        </div>

        {showAdminActions && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={handleHide}>
              {post.isHidden ? copy.show : copy.hide}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              {copy.delete}
            </Button>
          </div>
        )}
      </div>

      <div
        className="relative aspect-[4/3] max-w-full cursor-pointer overflow-hidden rounded-lg bg-paper-2"
        onClick={() => onPostClick && onPostClick(post)}
      >
        <Image
          src={post.imageUrl}
          alt={post.description || "Post image"}
          width={600}
          height={400}
          className="h-full w-full max-w-full object-cover"
          priority={false}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />

        {post.isHidden && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
            <span className="font-semibold text-brand-ink">{copy.hiddenPost}</span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="-ml-2 flex items-center">
            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded px-2 transition-colors duration-micro ease-out ${
                isLiked ? "text-error" : "text-ink-2 hover:text-error"
              } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`}
                aria-hidden="true"
              />
              <span className="text-sm tabular-nums">{likeCount}</span>
            </button>

            <button
              onClick={() => onPostClick && onPostClick(post)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded px-2 text-ink-2 transition-colors duration-micro ease-out hover:text-brand"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm tabular-nums">{post.commentCount || 0}</span>
            </button>
          </div>

          {post.isAdminPost && <Badge variant="accent">Admin</Badge>}
        </div>

        {post.description && (
          <p className="max-w-measure text-sm leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">
              {post.userName || post.userEmail}
            </span>{" "}
            {post.description}
          </p>
        )}
      </div>
    </article>
  );
}
