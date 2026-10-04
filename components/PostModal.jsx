"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Heart, Trash2, User, X } from "lucide-react";
import { toast } from "react-toastify";
import { useLocale } from "next-intl";
import { useAccount } from "@/app/AuthProvider";
import { authorName } from "@/components/PostCard";
import { usePostLike } from "@/components/usePostLike";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/page";
import { canOptimizeImage } from "@/lib/images";
import { cn } from "@/lib/utils";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";
import { socialUtils } from "@/utils/socialUtils";

const COPY = {
  tr: {
    close: "Kapat",
    previous: "Önceki fotoğraf",
    next: "Sonraki fotoğraf",
    photoBy: (name) => `${name} tarafından paylaşılan fotoğraf`,
    like: "Beğen",
    unlike: "Beğeniyi geri al",
    likes: "beğeni",
    likeError: "Beğeni kaydedilemedi. Tekrar dene.",
    comments: "Yorumlar",
    noComments: "Henüz yorum yok.",
    commentsError: "Yorumlar yüklenemedi.",
    retry: "Tekrar dene",
    addComment: "Yorum yaz",
    send: "Gönder",
    commentError: "Yorum gönderilemedi. Tekrar dene.",
    deleteComment: "Yorumu sil",
    deleteCommentTitle: "Yorum silinsin mi?",
    deleteCommentError: "Yorum silinemedi.",
    deletePost: "Fotoğrafı sil",
    deletePostTitle: "Fotoğraf silinsin mi?",
    deletePostBody: "Fotoğraf, beğenileri ve yorumlarıyla birlikte kaldırılır. Bu işlem geri alınamaz.",
    deletePostError: "Fotoğraf silinemedi.",
    cancel: "Vazgeç",
    confirmDelete: "Sil",
    hide: "Gizle",
    show: "Göster",
    hidden: "Gizli",
    actionError: "İşlem yapılamadı.",
  },
  en: {
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    photoBy: (name) => `Photo shared by ${name}`,
    like: "Like",
    unlike: "Remove like",
    likes: "likes",
    likeError: "Your like was not saved. Try again.",
    comments: "Comments",
    noComments: "No comments yet.",
    commentsError: "Comments could not be loaded.",
    retry: "Try again",
    addComment: "Write a comment",
    send: "Send",
    commentError: "Your comment was not sent. Try again.",
    deleteComment: "Delete comment",
    deleteCommentTitle: "Delete this comment?",
    deleteCommentError: "The comment could not be deleted.",
    deletePost: "Delete photo",
    deletePostTitle: "Delete this photo?",
    deletePostBody: "The photo is removed with its likes and comments. This cannot be undone.",
    deletePostError: "The photo could not be deleted.",
    cancel: "Cancel",
    confirmDelete: "Delete",
    hide: "Hide",
    show: "Show",
    hidden: "Hidden",
    actionError: "That did not work.",
  },
};

const floatingButton =
  "absolute z-raised flex h-control w-control items-center justify-center rounded border border-rule bg-paper text-ink transition-colors duration-micro ease-out hover:bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Avatar({ src, className }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper-3 text-muted-foreground",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="40px"
          unoptimized={!canOptimizeImage(src)}
          className="object-cover"
        />
      ) : (
        <User className="h-1/2 w-1/2" aria-hidden="true" />
      )}
    </span>
  );
}

// The photo viewer: the picture on the left (on top on phones), and beside it everything about
// it in one column: who shared it, the caption, likes and the full comment thread. Arrow keys and
// the edge buttons step through the board.
export default function PostModal({
  post,
  isOpen,
  onClose,
  onDelete,
  onChange,
  onPrev,
  onNext,
  showAdminActions = false,
}) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const { user, profile } = useAccount();
  const like = usePostLike(post, { onChange, errorMessage: copy.likeError });
  const [author, setAuthor] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsStatus, setCommentsStatus] = useState("loading");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const postId = post?.id;
  const authorId = post?.userId;

  const loadComments = async (id, isActive = () => true) => {
    setCommentsStatus("loading");
    const result = await socialUtils.getComments(id);
    if (!isActive()) return;
    if (result.success) {
      setComments(result.comments);
      setCommentsStatus("ready");
    } else {
      setCommentsStatus("error");
    }
  };

  useEffect(() => {
    if (!isOpen || !postId) return undefined;

    let active = true;
    setComments([]);
    setAuthor(null);
    setDraft("");
    loadComments(postId, () => active);
    if (authorId) {
      socialUtils
        .getUserProfile(authorId)
        .then((data) => active && setAuthor(data))
        .catch(() => {});
    }

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId, authorId]);

  if (!post) return null;

  const name = author?.name || authorName(post);
  const eventName = getLocalizedField(post, "eventName", locale) || post.eventName;
  const canDeletePost = showAdminActions || (Boolean(user) && post.userId === user.uid);

  const formatDate = (value) => {
    if (!value) return "";
    const date = value.toDate ? value.toDate() : new Date(value);
    return formatLocalizedDate(date, locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleKeyDown = (event) => {
    if (event.target.closest?.("input, textarea")) return;
    if (event.key === "ArrowLeft" && onPrev) {
      event.preventDefault();
      onPrev();
    } else if (event.key === "ArrowRight" && onNext) {
      event.preventDefault();
      onNext();
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!user || !text || sending) return;

    setSending(true);
    const userName = profile?.name || user.displayName || user.email;
    const userPhoto = profile?.photoURL || user.photoURL || null;
    const result = await socialUtils.addComment(
      post.id,
      user.uid,
      user.email,
      userName,
      userPhoto,
      text
    );
    setSending(false);

    if (!result.success) {
      toast.error(copy.commentError);
      return;
    }

    setComments((prev) => [
      ...prev,
      { ...result.comment, id: result.id, timestamp: new Date(), userName, userPhoto },
    ]);
    setDraft("");
    onChange?.({ ...post, commentCount: (post.commentCount || 0) + 1 });
  };

  const confirmDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);

    if (target?.type === "post") {
      const result = await socialUtils.deletePost(post.id);
      if (result.success) {
        onDelete?.(post.id);
        onClose();
      } else {
        toast.error(copy.deletePostError);
      }
      return;
    }

    if (target?.type === "comment") {
      const result = await socialUtils.deleteComment(target.id, post.id);
      if (result.success) {
        setComments((prev) => prev.filter((comment) => comment.id !== target.id));
        onChange?.({ ...post, commentCount: Math.max(0, (post.commentCount || 0) - 1) });
      } else {
        toast.error(copy.deleteCommentError);
      }
    }
  };

  const handleHide = async () => {
    const result = await socialUtils.hidePost(post.id, !post.isHidden);
    if (result.success) {
      onDelete?.(post.id);
      onClose();
    } else {
      toast.error(copy.actionError);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            onKeyDown={handleKeyDown}
            className="fixed inset-0 z-modal flex flex-col bg-background text-foreground duration-short data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:inset-auto md:left-1/2 md:top-1/2 md:grid md:h-[min(90dvh,46rem)] md:w-[calc(100%-4rem)] md:max-w-5xl md:-translate-x-1/2 md:-translate-y-1/2 md:grid-cols-[minmax(0,1fr)_22rem] md:overflow-hidden md:rounded-lg md:border md:border-rule"
          >
            <div className="relative h-[42dvh] shrink-0 bg-paper-2 md:h-auto">
              <Image
                key={post.id}
                src={post.imageUrl}
                alt={post.description || copy.photoBy(name)}
                fill
                priority
                sizes="(min-width: 768px) 60vw, 100vw"
                unoptimized={!canOptimizeImage(post.imageUrl)}
                className="object-contain"
              />
              {onPrev && (
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label={copy.previous}
                  className={cn(floatingButton, "left-3 top-1/2 -translate-y-1/2")}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  aria-label={copy.next}
                  className={cn(floatingButton, "right-3 top-1/2 -translate-y-1/2 md:right-3")}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col md:border-l md:border-rule">
              <header className="flex items-center gap-3 border-b border-rule p-4 pr-16">
                <Avatar src={author?.photoURL || post.userPhoto} className="h-10 w-10" />
                <div className="min-w-0">
                  <DialogTitle className="truncate font-sans text-base font-semibold tracking-normal">
                    {name}
                  </DialogTitle>
                  {eventName && <p className="truncate text-sm text-ink-2">{eventName}</p>}
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
                <div className="border-b border-rule py-4">
                  {post.description ? (
                    <DialogDescription className="whitespace-pre-line text-base text-ink">
                      {post.description}
                    </DialogDescription>
                  ) : (
                    <DialogDescription className="sr-only">{copy.photoBy(name)}</DialogDescription>
                  )}
                  <p className="mt-2 font-outlier text-xs text-muted-foreground">
                    {formatDate(post.timestamp)}
                  </p>

                  <div className="-ml-2 mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={like.toggle}
                      disabled={!like.canLike}
                      aria-pressed={like.liked}
                      aria-label={like.liked ? copy.unlike : copy.like}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2 rounded px-2 text-sm text-ink-2 transition-colors duration-micro ease-out hover:text-ink disabled:cursor-not-allowed",
                        like.liked && "text-brand hover:text-brand"
                      )}
                    >
                      <Heart
                        className={cn("h-5 w-5", like.liked && "fill-current")}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="font-outlier tabular-nums">{like.count}</span> {copy.likes}
                      </span>
                    </button>
                    {post.isHidden && <Badge variant="warning">{copy.hidden}</Badge>}
                  </div>
                </div>

                <section aria-labelledby="post-comments-title" className="py-4">
                  <h3 id="post-comments-title" className="font-display text-base font-bold">
                    {copy.comments}
                    {comments.length > 0 && (
                      <span className="ml-2 font-outlier text-xs font-normal text-muted-foreground">
                        {comments.length}
                      </span>
                    )}
                  </h3>

                  {commentsStatus === "loading" && (
                    <div className="mt-4 space-y-4" role="status">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  )}

                  {commentsStatus === "error" && (
                    <p className="mt-3 text-sm text-ink-2">
                      {copy.commentsError}{" "}
                      <Button variant="link" onClick={() => loadComments(post.id)}>
                        {copy.retry}
                      </Button>
                    </p>
                  )}

                  {commentsStatus === "ready" && comments.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">{copy.noComments}</p>
                  )}

                  {commentsStatus === "ready" && comments.length > 0 && (
                    <ul className="mt-2">
                      {comments.map((comment) => (
                        <li
                          key={comment.id}
                          className="flex gap-3 border-b border-rule py-3 last:border-b-0"
                        >
                          <Avatar src={comment.userPhoto} className="mt-0.5 h-7 w-7" />
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm">
                              <span className="font-semibold text-ink">{comment.userName}</span>{" "}
                              <span className="text-ink-2">{comment.text}</span>
                            </p>
                            <p className="mt-0.5 font-outlier text-xs text-muted-foreground">
                              {formatDate(comment.timestamp)}
                            </p>
                          </div>
                          {showAdminActions && (
                            <button
                              type="button"
                              onClick={() => setPendingDelete({ type: "comment", id: comment.id })}
                              aria-label={copy.deleteComment}
                              className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors duration-micro ease-out hover:text-error"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {(canDeletePost || showAdminActions) && (
                  <div className="flex flex-wrap gap-x-6 border-t border-rule py-2">
                    {showAdminActions && (
                      <Button variant="link" className="min-h-11 text-ink" onClick={handleHide}>
                        {post.isHidden ? copy.show : copy.hide}
                      </Button>
                    )}
                    {canDeletePost && (
                      <Button
                        variant="link"
                        className="min-h-11 text-error"
                        onClick={() => setPendingDelete({ type: "post" })}
                      >
                        {copy.deletePost}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleAddComment}
                className="flex items-center gap-2 border-t border-rule p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              >
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={copy.addComment}
                  aria-label={copy.addComment}
                  disabled={!user}
                  maxLength={200}
                  className="min-w-0 flex-1"
                />
                <Button type="submit" loading={sending} disabled={!user || !draft.trim()}>
                  {copy.send}
                </Button>
              </form>
            </div>

            <DialogPrimitive.Close aria-label={copy.close} className={cn(floatingButton, "right-3 top-3")}>
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.type === "post" ? copy.deletePostTitle : copy.deleteCommentTitle}
            </AlertDialogTitle>
            {pendingDelete?.type === "post" && (
              <AlertDialogDescription>{copy.deletePostBody}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
