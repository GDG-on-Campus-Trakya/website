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
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

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
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserProfileData(userDoc.data());
      }
    } catch (error) {
      logger.error("Error loading user profile:", error);
    }
  };

  const loadPostAuthorProfile = async () => {
    if (!post?.userId) return;

    try {
      const userDoc = await getDoc(doc(db, "users", post.userId));
      if (userDoc.exists()) {
        setPostAuthorProfile(userDoc.data());
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

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ overscrollBehavior: "contain" }}
    >
      <div className="md:hidden w-full h-full flex flex-col max-w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm max-w-full">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
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
                      className="w-full h-full object-cover"
                    />
                  );
                }
                return <User className="w-4 h-4 text-white" />;
              })()}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                {postAuthorProfile?.name || post.userName || post.userEmail}
              </h3>
              {eventName && (
                <div className="flex items-center space-x-1 text-blue-400 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>{eventName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {(showAdminActions || post.userId === user?.uid) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-1 min-w-[120px] z-10">
                    {showAdminActions && (
                      <button
                        key="hide-button"
                        onClick={handleHide}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600"
                      >
                        {post.isHidden ? copy.show : copy.hide}
                      </button>
                    )}
                    {(showAdminActions || post.userId === user?.uid) && (
                      <button
                        key="delete-button"
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600"
                      >
                        {copy.delete}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={onClose} className="text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-black flex items-center justify-center max-w-full overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.description || "Post image"}
            width={800}
            height={800}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        <div className="bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                disabled={!user || isLiking}
                className={`transition-colors ${
                  isLiked ? "text-red-500" : "text-white hover:text-red-500"
                } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <Heart className={`w-7 h-7 ${isLiked ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={() => setShowCommentsDrawer(true)}
                className="text-white"
              >
                <MessageCircle className="w-7 h-7" />
              </button>
            </div>
          </div>

          <div className="text-white font-semibold text-sm mb-2">
            {likeCount} {copy.likes}
          </div>

          {post.description && (
            <div className="text-white text-sm mb-2">
              <span className="font-semibold">
                {post.userName || post.userEmail}
              </span>{" "}
              {post.description}
            </div>
          )}

          <div className="text-gray-400 text-xs mb-3">
            {formatDate(post.timestamp)}
          </div>

          {comments.length > 0 && (
            <button
              onClick={() => setShowCommentsDrawer(true)}
              className="text-gray-400 text-sm mb-3 text-left"
            >
              {copy.viewComments(comments.length)}
            </button>
          )}

          <form
            onSubmit={handleAddComment}
            className="flex items-center space-x-3 border-t border-gray-700 pt-3"
          >
            <input
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder={copy.addComment}
              disabled={!user || isAddingComment}
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!user || !newComment.trim() || isAddingComment}
              className="text-blue-500 font-semibold disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isAddingComment ? "..." : copy.share}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="relative rounded-xl bg-gray-800/50 backdrop-blur-sm max-w-4xl w-full max-h-[90vh] overflow-hidden flex shadow-xl border border-gray-700/50">
          <div className="flex-1 bg-black flex items-center justify-center">
            <Image
              src={post.imageUrl}
              alt={post.description || "Post image"}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              priority
            />
          </div>

          <div className="w-96 flex flex-col bg-gray-800/50 backdrop-blur-sm">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
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
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                    return <User className="w-6 h-6 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {postAuthorProfile?.name || post.userName || post.userEmail}
                  </h3>
                  {eventName && (
                    <div className="flex items-center space-x-1 text-blue-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{eventName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {(showAdminActions || post.userId === user?.uid) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-8 bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-1 min-w-[120px] z-10">
                        {showAdminActions && (
                          <button
                            key="desktop-hide-button"
                            onClick={handleHide}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600"
                          >
                            {post.isHidden ? copy.show : copy.hide}
                          </button>
                        )}
                        {(showAdminActions || post.userId === user?.uid) && (
                          <button
                            key="desktop-delete-button"
                            onClick={handleDelete}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600"
                          >
                            {copy.delete}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 p-4 overflow-y-auto"
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {post.description && (
                <div className="mb-4 pb-3 border-b border-gray-700">
                  <div className="text-[#d1d1e0] text-sm leading-relaxed">
                    <span className="font-semibold text-white">
                      {post.userName || post.userEmail}
                    </span>{" "}
                    {post.description}
                  </div>
                  <div className="text-gray-500 text-xs mt-2">
                    {formatDate(post.timestamp)}
                  </div>
                </div>
              )}

              <div className="flex-1 py-4">
                {comments.length > 0 ? (
                  <button
                    onClick={() => setShowCommentsDrawer(true)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {copy.viewComments(comments.length)}
                  </button>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    {copy.noComments}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700 space-y-2 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {copy.event}: {eventName}
                  </span>
                </div>

                {post.isAdminPost && (
                  <div className="bg-green-600 px-2 py-1 rounded-full inline-block">
                    <span className="text-white text-xs font-medium">
                      {copy.admin}
                    </span>
                  </div>
                )}

                {post.isHidden && (
                  <div className="bg-yellow-600 px-2 py-1 rounded-full inline-block">
                    <span className="text-white text-xs font-medium">
                      {copy.hidden}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    disabled={!user || isLiking}
                    className={`flex items-center space-x-2 transition-colors ${
                      isLiked
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <Heart
                      className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`}
                    />
                  </button>

                  <button
                    onClick={() => setShowCommentsDrawer(true)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="text-white font-semibold text-sm space-y-1">
                <div>
                  {likeCount} {copy.likes}
                </div>
                <div>
                  {comments.length} {copy.comments.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCommentsDrawer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-end md:items-center justify-center"
          style={{ overscrollBehavior: "contain" }}
        >
          <div
            className="bg-gray-900 w-full md:w-96 md:max-w-lg md:rounded-t-2xl rounded-t-2xl md:rounded-2xl max-h-[80vh] md:max-h-[70vh] flex flex-col border border-gray-700"
            style={{ overscrollBehavior: "contain" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {copy.comments}
              </h3>
              <button
                onClick={() => setShowCommentsDrawer(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {isLoadingComments ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
                  {copy.commentsLoading}
                </div>
              ) : (
                <>
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={`drawer-${comment.id}`}
                        className="flex space-x-3"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {comment.userPhoto ? (
                            <Image
                              src={comment.userPhoto}
                              alt={comment.userName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm">
                            <span className="font-semibold">
                              {comment.userName}
                            </span>{" "}
                            <span className="text-gray-200">
                              {comment.text}
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs mt-1 flex items-center justify-between">
                            <span>{formatDate(comment.timestamp)}</span>
                            {showAdminActions && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-400 ml-2"
                                title={copy.deleteCommentTitle}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium mb-1">
                        {copy.noCommentsTitle}
                      </p>
                      <p className="text-sm">{copy.noCommentsBody}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-gray-700 p-4">
              <form
                onSubmit={handleAddComment}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {(() => {
                    const profilePhoto =
                      userProfileData?.photoURL || user?.photoURL;
                    return profilePhoto ? (
                      <Image
                        src={profilePhoto}
                        alt="Your profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    );
                  })()}
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder={copy.addComment}
                  disabled={!user || isAddingComment}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none border-none"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!user || !newComment.trim() || isAddingComment}
                  className="text-blue-500 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isAddingComment ? "..." : copy.share}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
