"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { logger } from "@/utils/logger";
import {
  X,
  Heart,
  MessageCircle,
  Calendar,
  User,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { socialUtils } from "../utils/socialUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function PostModal({
  post,
  isOpen,
  onClose,
  onDelete,
  showAdminActions = false,
}) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          commentsLoadError: "Failed to load comments.",
          likeError: "Like action failed.",
          commentAdded: "Comment added.",
          commentAddError: "Failed to add the comment.",
          confirmDeletePost: "Are you sure you want to delete this post?",
          deletePostSuccess: "Post deleted successfully.",
          deletePostError: "Failed to delete the post.",
          confirmDeleteComment:
            "Are you sure you want to delete this comment?",
          deleteCommentSuccess: "Comment deleted successfully.",
          deleteCommentError: "Failed to delete the comment.",
          postShown: "Post is now visible.",
          postHidden: "Post hidden.",
          actionError: "Action failed.",
          show: "Show",
          hide: "Hide",
          delete: "Delete",
          likes: "likes",
          comments: "Comments",
          viewComments: (count) => `View ${count} comments`,
          addComment: "Add a comment...",
          share: "Share",
          noComments: "No comments yet. Be the first to comment!",
          event: "Event",
          admin: "Admin",
          hidden: "Hidden",
          commentsLoading: "Loading comments...",
          deleteCommentTitle: "Delete Comment",
          noCommentsTitle: "No comments yet",
          noCommentsBody: "Be the first to comment!",
        }
      : {
          commentsLoadError: "Yorumlar yüklenirken hata oluştu!",
          likeError: "Beğeni işlemi başarısız!",
          commentAdded: "Yorum eklendi!",
          commentAddError: "Yorum eklenirken hata oluştu!",
          confirmDeletePost: "Bu postu silmek istediğinizden emin misiniz?",
          deletePostSuccess: "Post başarıyla silindi!",
          deletePostError: "Post silinirken hata oluştu!",
          confirmDeleteComment:
            "Bu yorumu silmek istediğinizden emin misiniz?",
          deleteCommentSuccess: "Yorum başarıyla silindi!",
          deleteCommentError: "Yorum silinirken hata oluştu!",
          postShown: "Post gösterildi!",
          postHidden: "Post gizlendi!",
          actionError: "İşlem başarısız!",
          show: "Göster",
          hide: "Gizle",
          delete: "Sil",
          likes: "beğeni",
          comments: "Yorumlar",
          viewComments: (count) => `${count} yorumu gör`,
          addComment: "Yorum ekle...",
          share: "Paylaş",
          noComments: "Henüz yorum yok. İlk yorumu sen yap!",
          event: "Etkinlik",
          admin: "Admin",
          hidden: "Gizli",
          commentsLoading: "Yorumlar yükleniyor...",
          deleteCommentTitle: "Yorumu Sil",
          noCommentsTitle: "Henüz yorum yok",
          noCommentsBody: "İlk yorumu sen yap!",
        };
  const [user] = useAuthState(auth);
  const [isLiked, setIsLiked] = useState(
    post?.likes?.includes(user?.uid) || false
  );
  const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [postAuthorProfile, setPostAuthorProfile] = useState(null);

  useEffect(() => {
    if (post) {
      setIsLiked(post.likes?.includes(user?.uid) || false);
      setLikeCount(post.likeCount || 0);
      loadComments();
      loadPostAuthorProfile();
    }
    if (user) {
      loadUserProfile();
    }
  }, [post, user?.uid]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const profile = await socialUtils.getUserProfile(user.uid);
      if (profile) {
        setUserProfileData(profile);
      }
    } catch (error) {
      logger.error("Error loading user profile:", error);
    }
  };

  const loadPostAuthorProfile = async () => {
    if (!post?.userId) return;

    try {
      // Usually already read for the feed card
      const profile = await socialUtils.getUserProfile(post.userId);
      if (profile) {
        setPostAuthorProfile(profile);
      } else {
        setPostAuthorProfile(null);
      }
    } catch (error) {
      logger.error("Error loading post author profile:", error);
    }
  };

  const loadComments = async () => {
    if (!post?.id) return;

    setIsLoadingComments(true);
    const result = await socialUtils.getComments(post.id);

    if (result.success) {
      setComments(result.comments);
    } else {
      toast.error(copy.commentsLoadError);
    }
    setIsLoadingComments(false);
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const handleLike = async () => {
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

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!user || !newComment.trim() || isAddingComment) return;

    setIsAddingComment(true);
    const result = await socialUtils.addComment(
      post.id,
      user.uid,
      user.email,
      userProfileData?.name || user.displayName || user.email,
      userProfileData?.photoURL || user.photoURL,
      newComment
    );

    if (result.success) {
      const newCommentData = {
        ...result.comment,
        timestamp: new Date(),
        userName: userProfileData?.name || user.displayName || user.email,
        userPhoto: userProfileData?.photoURL || user.photoURL,
      };
      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
      toast.success(copy.commentAdded);
    } else {
      toast.error(copy.commentAddError);
    }
    setIsAddingComment(false);
  };

  const handleDelete = async () => {
    if (!confirm(copy.confirmDeletePost)) return;

    const result = await socialUtils.deletePost(post.id);
    if (result.success) {
      toast.success(copy.deletePostSuccess);
      onDelete && onDelete(post.id);
      onClose();
    } else {
      toast.error(copy.deletePostError);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm(copy.confirmDeleteComment)) return;

    const result = await socialUtils.deleteComment(commentId, post.id);
    if (result.success) {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success(copy.deleteCommentSuccess);
    } else {
      toast.error(copy.deleteCommentError);
    }
  };

  const handleHide = async () => {
    const result = await socialUtils.hidePost(post.id, !post.isHidden);
    if (result.success) {
      toast.success(post.isHidden ? copy.postShown : copy.postHidden);
      onDelete && onDelete(post.id);
      onClose();
    } else {
      toast.error(copy.actionError);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatLocalizedDate(date, locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const eventName =
    getLocalizedField(post, "eventName", locale) ||
    post.eventNameEn ||
    post.eventName;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const iconButton =
    "inline-flex h-control w-control items-center justify-center rounded text-muted-foreground transition-colors duration-micro ease-out hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  const menuPanel =
    "absolute right-0 top-11 z-dropdown min-w-[120px] rounded-lg border border-rule bg-popover py-1 shadow-whisper";

  const menuItem =
    "flex min-h-11 w-full items-center whitespace-nowrap px-3 text-left text-sm hover:bg-secondary";

  const avatarBox =
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper-3 text-muted-foreground";

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 animate-in fade-in-0 duration-short"
      onClick={handleBackdropClick}
      style={{ overscrollBehavior: "contain" }}
    >
      <div className="flex h-full w-full max-w-full flex-col overflow-hidden bg-background text-foreground md:hidden">
        <div className="flex max-w-full items-center justify-between gap-2 border-b border-rule p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`h-8 w-8 ${avatarBox}`}>
              {(() => {
                const profilePhoto =
                  postAuthorProfile?.photoURL || post.userPhoto;
                if (profilePhoto) {
                  return (
                    <Image
                      src={profilePhoto}
                      alt={
                        postAuthorProfile?.name ||
                        post.userName ||
                        post.userEmail
                      }
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  );
                }
                return <User className="h-4 w-4" aria-hidden="true" />;
              })()}
            </div>
            <div className="min-w-0">
              <h3 className="break-words font-sans text-sm font-semibold">
                {postAuthorProfile?.name || post.userName || post.userEmail}
              </h3>
              {eventName && (
                <div className="flex items-center gap-1 text-xs text-ink-2">
                  <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="break-words">{eventName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            {(showAdminActions || post.userId === user?.uid) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={iconButton}
                >
                  <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                </button>

                {showMenu && (
                  <div className={menuPanel}>
                    {showAdminActions && (
                      <button
                        key="hide-button"
                        onClick={handleHide}
                        className={menuItem}
                      >
                        {post.isHidden ? copy.show : copy.hide}
                      </button>
                    )}
                    {(showAdminActions || post.userId === user?.uid) && (
                      <button
                        key="delete-button"
                        onClick={handleDelete}
                        className={`${menuItem} text-error`}
                      >
                        {copy.delete}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={onClose} className={iconButton}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex max-w-full flex-1 items-center justify-center overflow-hidden bg-paper-2">
          <Image
            src={post.imageUrl}
            alt={post.description || "Post image"}
            width={800}
            height={800}
            className="h-full w-full object-contain"
            priority
          />
        </div>

        <div className="border-t border-rule p-4">
          <div className="-ml-2 flex items-center">
            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`inline-flex h-control w-control items-center justify-center rounded transition-colors duration-micro ease-out ${
                isLiked ? "text-error" : "text-ink-2 hover:text-error"
              } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Heart
                className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`}
                aria-hidden="true"
              />
            </button>

            <button
              onClick={() => setShowCommentsDrawer(true)}
              className="inline-flex h-control w-control items-center justify-center rounded text-ink-2 transition-colors duration-micro ease-out hover:text-brand"
            >
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-2 text-sm font-semibold">
            <span className="tabular-nums">{likeCount}</span> {copy.likes}
          </div>

          {post.description && (
            <div className="mb-2 text-sm text-ink-2">
              <span className="font-semibold text-ink">
                {post.userName || post.userEmail}
              </span>{" "}
              {post.description}
            </div>
          )}

          <div className="mb-3 font-outlier text-xs text-muted-foreground">
            {formatDate(post.timestamp)}
          </div>

          {comments.length > 0 && (
            <button
              onClick={() => setShowCommentsDrawer(true)}
              className="mb-3 inline-flex min-h-11 items-center text-left text-sm text-muted-foreground hover:text-ink"
            >
              {copy.viewComments(comments.length)}
            </button>
          )}

          <form
            onSubmit={handleAddComment}
            className="flex items-center gap-3 border-t border-rule pt-3"
          >
            <Input
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder={copy.addComment}
              aria-label={copy.addComment}
              disabled={!user || isAddingComment}
              className="min-w-0 flex-1"
              maxLength={200}
            />
            <Button
              type="submit"
              disabled={!user || !newComment.trim() || isAddingComment}
            >
              {isAddingComment ? "..." : copy.share}
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden w-full max-w-4xl px-4 md:block">
        <div className="relative flex max-h-[90vh] w-full overflow-hidden rounded-lg border border-rule bg-background text-foreground">
          <div className="flex min-w-0 flex-1 items-center justify-center bg-paper-2">
            <Image
              src={post.imageUrl}
              alt={post.description || "Post image"}
              width={800}
              height={600}
              className="max-h-full max-w-full object-contain"
              priority
            />
          </div>

          <div className="flex w-96 shrink-0 flex-col border-l border-rule bg-background">
            <div className="flex items-center justify-between gap-2 border-b border-rule p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`h-10 w-10 ${avatarBox}`}>
                  {(() => {
                    const profilePhoto =
                      postAuthorProfile?.photoURL || post.userPhoto;
                    if (profilePhoto) {
                      return (
                        <Image
                          src={profilePhoto}
                          alt={
                            postAuthorProfile?.name ||
                            post.userName ||
                            post.userEmail
                          }
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      );
                    }
                    return <User className="h-5 w-5" aria-hidden="true" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <h3 className="break-words font-sans text-sm font-semibold">
                    {postAuthorProfile?.name || post.userName || post.userEmail}
                  </h3>
                  {eventName && (
                    <div className="flex items-center gap-1 text-xs text-ink-2">
                      <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="break-words">{eventName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center">
                {(showAdminActions || post.userId === user?.uid) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className={iconButton}
                    >
                      <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {showMenu && (
                      <div className={menuPanel}>
                        {showAdminActions && (
                          <button
                            key="desktop-hide-button"
                            onClick={handleHide}
                            className={menuItem}
                          >
                            {post.isHidden ? copy.show : copy.hide}
                          </button>
                        )}
                        {(showAdminActions || post.userId === user?.uid) && (
                          <button
                            key="desktop-delete-button"
                            onClick={handleDelete}
                            className={`${menuItem} text-error`}
                          >
                            {copy.delete}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={onClose} className={iconButton}>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4"
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {post.description && (
                <div className="mb-4 border-b border-rule pb-3">
                  <div className="text-sm leading-relaxed text-ink-2">
                    <span className="font-semibold text-ink">
                      {post.userName || post.userEmail}
                    </span>{" "}
                    {post.description}
                  </div>
                  <div className="mt-2 font-outlier text-xs text-muted-foreground">
                    {formatDate(post.timestamp)}
                  </div>
                </div>
              )}

              <div className="flex-1 py-4">
                {comments.length > 0 ? (
                  <button
                    onClick={() => setShowCommentsDrawer(true)}
                    className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors duration-micro ease-out hover:text-ink"
                  >
                    {copy.viewComments(comments.length)}
                  </button>
                ) : (
                  <div className="py-8 text-sm text-muted-foreground">
                    {copy.noComments}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 border-t border-rule pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-words">
                    {copy.event}: {eventName}
                  </span>
                </div>

                {post.isAdminPost && (
                  <div>
                    <Badge variant="accent">{copy.admin}</Badge>
                  </div>
                )}

                {post.isHidden && (
                  <div>
                    <Badge variant="warning">{copy.hidden}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-rule p-4">
              <div className="-ml-2 mb-2 flex items-center">
                <button
                  onClick={handleLike}
                  disabled={!user || isLiking}
                  className={`inline-flex h-control w-control items-center justify-center rounded transition-colors duration-micro ease-out ${
                    isLiked ? "text-error" : "text-ink-2 hover:text-error"
                  } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Heart
                    className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <button
                  onClick={() => setShowCommentsDrawer(true)}
                  className="inline-flex h-control w-control items-center justify-center rounded text-ink-2 transition-colors duration-micro ease-out hover:text-brand"
                >
                  <MessageCircle className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-1 text-sm font-semibold">
                <div>
                  <span className="tabular-nums">{likeCount}</span> {copy.likes}
                </div>
                <div>
                  <span className="tabular-nums">{comments.length}</span>{" "}
                  {copy.comments.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCommentsDrawer && (
        <div
          className="fixed inset-0 z-popover flex items-end justify-center bg-ink/60 animate-in fade-in-0 duration-short md:items-center"
          style={{ overscrollBehavior: "contain" }}
        >
          <div
            className="flex max-h-[80vh] w-full flex-col rounded-t-lg border border-rule bg-background text-foreground md:max-h-[70vh] md:w-96 md:max-w-lg md:rounded-lg"
            style={{ overscrollBehavior: "contain" }}
          >
            <div className="flex items-center justify-between border-b border-rule py-2 pl-4 pr-2">
              <h3 className="font-display text-lg font-semibold">
                {copy.comments}
              </h3>
              <button
                onClick={() => setShowCommentsDrawer(false)}
                className={iconButton}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div
              className="flex-1 space-y-4 overflow-y-auto p-4"
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {isLoadingComments ? (
                <div role="status" className="py-8 text-sm text-muted-foreground">
                  {copy.commentsLoading}
                </div>
              ) : (
                <>
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={`drawer-${comment.id}`}
                        className="flex gap-3"
                      >
                        <div className={`h-8 w-8 ${avatarBox}`}>
                          {comment.userPhoto ? (
                            <Image
                              src={comment.userPhoto}
                              alt={comment.userName}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="break-words text-sm">
                            <span className="font-semibold">
                              {comment.userName}
                            </span>{" "}
                            <span className="text-ink-2">{comment.text}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between font-outlier text-xs text-muted-foreground">
                            <span>{formatDate(comment.timestamp)}</span>
                            {showAdminActions && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="-my-2 ml-2 inline-flex h-9 w-9 items-center justify-center rounded text-error hover:bg-secondary"
                                title={copy.deleteCommentTitle}
                                aria-label={copy.deleteCommentTitle}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8">
                      <p className="font-display text-lg font-semibold">
                        {copy.noCommentsTitle}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {copy.noCommentsBody}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-rule p-4">
              <form
                onSubmit={handleAddComment}
                className="flex items-center gap-3"
              >
                <div className={`h-8 w-8 ${avatarBox}`}>
                  {(() => {
                    const profilePhoto =
                      userProfileData?.photoURL || user?.photoURL;
                    return profilePhoto ? (
                      <Image
                        src={profilePhoto}
                        alt="Your profile"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" aria-hidden="true" />
                    );
                  })()}
                </div>
                <Input
                  type="text"
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder={copy.addComment}
                  aria-label={copy.addComment}
                  disabled={!user || isAddingComment}
                  className="min-w-0 flex-1"
                  maxLength={200}
                />
                <Button
                  type="submit"
                  disabled={!user || !newComment.trim() || isAddingComment}
                >
                  {isAddingComment ? "..." : copy.share}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
