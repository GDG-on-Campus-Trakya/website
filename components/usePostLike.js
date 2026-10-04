"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAccount } from "@/app/AuthProvider";
import { socialUtils } from "@/utils/socialUtils";

const readLike = (post, uid) => ({
  liked: Boolean(uid && post?.likes?.includes(uid)),
  count: post?.likeCount || 0,
});

// Like state for one post, shared by the photo tile and the viewer. The heart changes at once;
// a failed request puts it back and says so. `onChange` receives the post with the new counts so
// the other view of the same post stays in step.
export function usePostLike(post, { onChange, errorMessage }) {
  const { user } = useAccount();
  const uid = user?.uid;
  const [like, setLike] = useState(() => readLike(post, uid));
  const pending = useRef(false);

  useEffect(() => {
    setLike(readLike(post, uid));
  }, [post?.id, post?.likeCount, post?.likes, uid]);

  const toggle = async () => {
    if (!uid || !post || pending.current) return;

    pending.current = true;
    const before = like;
    setLike({
      liked: !before.liked,
      count: Math.max(0, before.count + (before.liked ? -1 : 1)),
    });

    const result = await socialUtils.likePost(post.id, uid);
    pending.current = false;

    if (!result.success) {
      setLike(before);
      toast.error(errorMessage);
      return;
    }

    // The server toggles against what it has stored, which can differ from this tab's view.
    const liked = result.action === "liked";
    const count = Math.max(0, before.count + (liked ? 1 : -1));
    const others = (post.likes || []).filter((id) => id !== uid);
    setLike({ liked, count });
    onChange?.({ ...post, likes: liked ? [...others, uid] : others, likeCount: count });
  };

  return { ...like, canLike: Boolean(uid), toggle };
}
