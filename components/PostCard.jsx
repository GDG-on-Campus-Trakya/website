"use client";

import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePostLike } from "@/components/usePostLike";
import { canOptimizeImage } from "@/lib/images";
import { cn } from "@/lib/utils";
import { socialUtils } from "@/utils/socialUtils";

const COPY = {
  tr: {
    open: (name) => `${name} paylaştı, büyüt`,
    like: "Beğen",
    unlike: "Beğeniyi geri al",
    likes: (count) => `${count} beğeni`,
    comments: (count) => `${count} yorum`,
    likeError: "Beğeni kaydedilemedi. Tekrar dene.",
    hidden: "Gizli",
    show: "Göster",
    hide: "Gizle",
    delete: "Sil",
    confirmDelete: "Bu fotoğraf silinsin mi? Bu işlem geri alınamaz.",
    deleteError: "Fotoğraf silinemedi.",
    actionError: "İşlem yapılamadı.",
  },
  en: {
    open: (name) => `Shared by ${name}, open`,
    like: "Like",
    unlike: "Remove like",
    likes: (count) => `${count} likes`,
    comments: (count) => `${count} comments`,
    likeError: "Your like was not saved. Try again.",
    hidden: "Hidden",
    show: "Show",
    hide: "Hide",
    delete: "Delete",
    confirmDelete: "Delete this photo? This cannot be undone.",
    deleteError: "The photo could not be deleted.",
    actionError: "That did not work.",
  },
};

export const authorName = (post) =>
  post.userName && !post.userName.includes("@")
    ? post.userName
    : (post.userName || post.userEmail || "").split("@")[0];

// One photo on the board: a square crop that opens the viewer, the author, and the like and
// comment counts on a single caption line, like a frame on a contact sheet.
export default function PostCard({
  post,
  onPostClick,
  onDelete,
  onChange,
  showAdminActions = false,
  sizes = "(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 48vw",
}) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const like = usePostLike(post, { onChange, errorMessage: copy.likeError });
  const name = authorName(post);
  const comments = post.commentCount || 0;

  const handleDelete = async () => {
    if (!confirm(copy.confirmDelete)) return;

    const result = await socialUtils.deletePost(post.id);
    if (result.success) {
      onDelete?.(post.id);
    } else {
      toast.error(copy.deleteError);
    }
  };

  const handleHide = async () => {
    const result = await socialUtils.hidePost(post.id, !post.isHidden);
    if (result.success) {
      onDelete?.(post.id);
    } else {
      toast.error(copy.actionError);
    }
  };

  return (
    <article className="group min-w-0">
      <button
        type="button"
        onClick={() => onPostClick?.(post)}
        aria-label={copy.open(name)}
        className="relative block aspect-square w-full overflow-hidden rounded-sm bg-paper-2"
      >
        <Image
          src={post.imageUrl}
          alt={post.description || ""}
          fill
          sizes={sizes}
          unoptimized={!canOptimizeImage(post.imageUrl)}
          className="object-cover transition-opacity duration-micro ease-out group-hover:opacity-90"
        />
        {post.isHidden && (
          <Badge variant="warning" className="absolute left-2 top-2">
            {copy.hidden}
          </Badge>
        )}
      </button>

      <div className="flex min-h-11 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm text-ink-2">{name}</p>

        <div className="-mr-2 flex shrink-0 items-center font-outlier text-xs tabular-nums text-muted-foreground">
          <button
            type="button"
            onClick={like.toggle}
            disabled={!like.canLike}
            aria-pressed={like.liked}
            aria-label={`${like.liked ? copy.unlike : copy.like}, ${copy.likes(like.count)}`}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-sm px-2 transition-colors duration-micro ease-out hover:text-ink disabled:cursor-not-allowed",
              like.liked && "text-brand hover:text-brand"
            )}
          >
            <Heart
              className={cn("h-3.5 w-3.5", like.liked && "fill-current")}
              aria-hidden="true"
            />
            {like.count}
          </button>
          {comments > 0 && (
            <span className="inline-flex items-center gap-1 pr-2" aria-label={copy.comments(comments)}>
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {comments}
            </span>
          )}
        </div>
      </div>

      {showAdminActions && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleHide}>
            {post.isHidden ? copy.show : copy.hide}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            {copy.delete}
          </Button>
        </div>
      )}
    </article>
  );
}
