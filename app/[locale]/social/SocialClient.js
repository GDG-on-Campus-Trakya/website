"use client";

// Hallmark · genre: editorial · macrostructure: Catalogue (photos banded by event)
// design-system: design.md · designed-as-app

import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";
import { useAccount } from "@/app/AuthProvider";
import PostModal from "@/components/PostModal";
import PostUpload from "@/components/PostUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { loginHref } from "@/utils/redirect";
import { socialUtils } from "@/utils/socialUtils";
import SocialBoard, { BOARD_COPY, groupPostsByEvent } from "./SocialBoard";

const PAGE_SIZE = 24;

const COPY = {
  tr: {
    loadMoreError: "Daha fazla fotoğraf yüklenemedi. Tekrar dene.",
    shareTitle: "Fotoğraf paylaş",
    shareDescription: "Paylaştığın fotoğraf herkese açık sosyal sayfada görünür.",
  },
  en: {
    loadMoreError: "More photos could not be loaded. Try again.",
    shareTitle: "Share a photo",
    shareDescription: "The photo you share appears on the public social page.",
  },
};

export default function SocialClient({ events = [] }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const { user, loading } = useAccount();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [raffles, setRaffles] = useState([]);
  const [activeEvents, setActiveEvents] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const eventsById = useMemo(
    () => Object.fromEntries(events.map((event) => [event.id, event])),
    [events]
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace(loginHref("/social"));
    }
  }, [user, loading, router]);

  const loadFirstPage = useCallback(async () => {
    setStatus("loading");
    const result = await socialUtils.getPosts({ isHidden: false }, { limit: PAGE_SIZE });
    if (!result.success) {
      setStatus("error");
      return;
    }
    setPosts(result.posts);
    setCursor(result.lastDoc);
    setHasMore(result.hasMore);
    setStatus("ready");
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const result = await socialUtils.getPosts(
      { isHidden: false },
      { limit: PAGE_SIZE, startAfter: cursor }
    );
    setLoadingMore(false);

    if (!result.success) {
      toast.error(copy.loadMoreError);
      return;
    }
    setPosts((prev) => [...prev, ...result.posts]);
    setCursor(result.lastDoc);
    setHasMore(result.hasMore);
  };

  useEffect(() => {
    if (!user) return;

    loadFirstPage();
    socialUtils.getAnnouncements({ limit: 50 }).then((result) => {
      if (result.success) {
        setRaffles(result.announcements.filter((item) => item.type === "raffle_result"));
      }
    });
    socialUtils.getActiveEventsForPosting().then((result) => {
      setActiveEvents(result.success ? result.events.filter((event) => event.canPost) : []);
    });
  }, [user?.uid, loadFirstPage]);

  const groups = useMemo(
    () => groupPostsByEvent(posts, eventsById, locale, BOARD_COPY[locale].otherPhotos),
    [posts, eventsById, locale]
  );

  // The viewer steps through photos in the order the board shows them.
  const ordered = useMemo(() => groups.flatMap((group) => group.posts), [groups]);
  const selectedIndex = ordered.findIndex((post) => post.id === selectedId);
  const selectedPost = selectedIndex >= 0 ? ordered[selectedIndex] : null;

  const { rafflesByEvent, earlierRaffles } = useMemo(() => {
    const shown = new Set(groups.map((group) => group.eventId).filter(Boolean));
    const byEvent = new Map();
    const earlier = [];
    for (const raffle of raffles) {
      if (raffle.eventId && shown.has(raffle.eventId)) {
        byEvent.set(raffle.eventId, [...(byEvent.get(raffle.eventId) || []), raffle]);
      } else {
        earlier.push(raffle);
      }
    }
    return { rafflesByEvent: byEvent, earlierRaffles: earlier };
  }, [groups, raffles]);

  const handlePostChange = (updated) => {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
  };

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setSelectedId((current) => (current === postId ? null : current));
  };

  const handleUploadComplete = () => {
    setUploadOpen(false);
    loadFirstPage();
  };

  return (
    <>
      <SocialBoard
        locale={locale}
        groups={groups}
        rafflesByEvent={rafflesByEvent}
        earlierRaffles={earlierRaffles}
        activeEvents={activeEvents}
        status={loading || !user ? "loading" : status}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        onRetry={loadFirstPage}
        onOpenPost={(post) => setSelectedId(post.id)}
        onPostChange={handlePostChange}
        onDelete={handleDelete}
        onShare={() => setUploadOpen(true)}
      />

      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedId(null)}
        onDelete={handleDelete}
        onChange={handlePostChange}
        onPrev={selectedIndex > 0 ? () => setSelectedId(ordered[selectedIndex - 1].id) : undefined}
        onNext={
          selectedIndex >= 0 && selectedIndex < ordered.length - 1
            ? () => setSelectedId(ordered[selectedIndex + 1].id)
            : undefined
        }
      />

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="text-left sm:text-left">
            <DialogTitle className="text-xl">{copy.shareTitle}</DialogTitle>
            <DialogDescription>{copy.shareDescription}</DialogDescription>
          </DialogHeader>
          <PostUpload
            activeEvents={activeEvents ?? undefined}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ToastContainer position="top-right" autoClose={4000} newestOnTop closeOnClick pauseOnHover theme="light" />
    </>
  );
}
