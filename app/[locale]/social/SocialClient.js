"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { socialUtils } from "@/utils/socialUtils";
import PostCard from "@/components/PostCard";
import PostModal from "@/components/PostModal";
import PostUpload from "@/components/PostUpload";
import AnnouncementCard from "@/components/AnnouncementCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/input";
import { PageContainer, PageHeader, EmptyState } from "@/components/ui/page";
import { useRouter } from "@/i18n/navigation";
import { loginHref } from "@/utils/redirect";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";

export default function SocialClient() {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          postsLoadError: "Failed to load posts.",
          resultsLoadError: "Failed to load raffle results.",
          loading: "Loading...",
          signInRequired: "You need to sign in...",
          title: "Social",
          subtitle: "Share event moments and join raffles!",
          photosTab: "Event Photos",
          resultsTab: "Raffle Results",
          filter: "Filter:",
          allEvents: (count) => `All Events (${count} photos)`,
          eventStats: (name, count) => `${name} (${count} photos)`,
          activeEventsTitle: (count) => `${count} active events available`,
          postsLoading: "Loading posts...",
          noPhotos: "No event photos yet",
          noPhotosForEvent: "No photos from this event yet",
          firstPhoto: "Share the first event photo and join the raffle!",
          sharePhoto: "Share Event Photo",
          activeEventsAvailable: (count) => `${count} active events available`,
          noActiveEvents: "There are no active events right now",
          noActiveEventsBody:
            "When new events start, you will be able to share your photos here.",
          activeEventsHint:
            "Events usually stay open for photo sharing for 3 days after they start.",
          noResults: "No raffle results yet",
          noResultsBody:
            "Results will be announced here once event raffles are completed.",
          resultsHint: "Share an event photo to join raffles.",
          loadMore: "Load More",
        }
      : {
          postsLoadError: "Postlar yüklenirken hata oluştu!",
          resultsLoadError: "Çekiliş sonuçları yüklenirken hata oluştu!",
          loading: "Yükleniyor...",
          signInRequired: "Giriş yapmanız gerekiyor...",
          title: "Sosyal Medya",
          subtitle: "Etkinlik anlarını paylaş, çekilişlere katıl!",
          photosTab: "Etkinlik Fotoğrafları",
          resultsTab: "Çekiliş Sonuçları",
          filter: "Filtre:",
          allEvents: (count) => `Tüm Etkinlikler (${count} fotoğraf)`,
          eventStats: (name, count) => `${name} (${count} fotoğraf)`,
          activeEventsTitle: (count) => `${count} aktif etkinlik mevcut`,
          postsLoading: "Postlar yükleniyor...",
          noPhotos: "Henüz etkinlik fotoğrafı yok",
          noPhotosForEvent: "Bu etkinlikten henüz fotoğraf yok",
          firstPhoto: "İlk etkinlik fotoğrafını sen paylaş ve çekilişe katıl!",
          sharePhoto: "Etkinlik Fotoğrafı Paylaş",
          activeEventsAvailable: (count) => `${count} aktif etkinlik mevcut`,
          noActiveEvents: "Şu anda aktif etkinlik yok",
          noActiveEventsBody:
            "Yeni etkinlikler başladığında burada fotoğraflarını paylaşabilirsin!",
          activeEventsHint:
            "Etkinlikler genellikle başladıktan sonra 3 gün boyunca fotoğraf paylaşımına açık kalır",
          noResults: "Henüz çekiliş sonucu yok",
          noResultsBody:
            "Etkinlik çekilişleri tamamlandığında sonuçlar burada ilan edilecek!",
          resultsHint: "Çekilişlere katılmak için etkinlik fotoğrafı paylaş",
          loadMore: "Daha Fazla Yükle",
        };

  const [user, loading] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState("all");
  const [currentTab, setCurrentTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(loginHref("/social"));
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (currentTab === "posts") {
      loadPosts();
    } else {
      loadAnnouncements();
    }
    loadActiveEvents();
  }, [currentTab]);

  useEffect(() => {
    applyFilter();
  }, [posts, filter]);

  const loadActiveEvents = async () => {
    setLoadingEvents(true);
    const result = await socialUtils.getActiveEventsForPosting();
    if (result.success) {
      setActiveEvents(result.events.filter((event) => event.canPost));
    }
    setLoadingEvents(false);
  };

  const loadPosts = async (loadMore = false) => {
    if (!loadMore) setIsLoading(true);

    const result = await socialUtils.getPosts(
      { isHidden: false },
      { limit: 10, startAfter: loadMore ? lastDoc : null }
    );

    if (result.success) {
      if (loadMore) {
        setPosts((prev) => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.posts.length === 10);
    } else {
      toast.error(copy.postsLoadError);
    }

    setIsLoading(false);
  };

  const loadAnnouncements = async (loadMore = false) => {
    if (!loadMore) setIsLoading(true);

    const result = await socialUtils.getAnnouncements({
      limit: 20,
      startAfter: loadMore ? lastDoc : null,
    });

    if (result.success) {
      const raffleResults = result.announcements.filter(
        (announcement) => announcement.type === "raffle_result"
      );

      if (loadMore) {
        setAnnouncements((prev) => [...prev, ...raffleResults]);
      } else {
        setAnnouncements(raffleResults);
      }
      setLastDoc(result.lastDoc);
      setHasMore(raffleResults.length === 20);
    } else {
      toast.error(copy.resultsLoadError);
    }

    setIsLoading(false);
  };

  const applyFilter = () => {
    let filtered = posts;

    if (filter !== "all") {
      filtered = posts.filter((post) => post.eventId === filter);
    }

    setFilteredPosts(filtered);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    if (currentTab === "posts") {
      loadPosts();
    }
  };

  const getFilterStats = () => {
    const total = posts.length;
    const eventGroups = {};

    posts.forEach((post) => {
      if (post.eventId) {
        eventGroups[post.eventId] = eventGroups[post.eventId] || {
          count: 0,
          name:
            locale === "en"
              ? post.eventNameEn || post.eventName
              : post.eventName,
        };
        eventGroups[post.eventId].count++;
      }
    });

    return { total, eventGroups };
  };

  if (loading) {
    return (
      <PageContainer>
        <p role="status" className="text-ink-2">
          {copy.loading}
        </p>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <p role="status" className="text-ink-2">
          {copy.signInRequired}
        </p>
      </PageContainer>
    );
  }

  const stats = getFilterStats();

  const tabClass = (active) =>
    `-mb-px whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors duration-micro ease-out ${
      active
        ? "border-ink text-ink"
        : "border-transparent text-muted-foreground hover:text-ink"
    }`;

  return (
    <PageContainer>
      <PageHeader
        title={copy.title}
        description={copy.subtitle}
        actions={
          currentTab === "posts" &&
          (loadingEvents ? (
            <Button disabled loading>
              <Plus aria-hidden="true" />
              {copy.sharePhoto}
            </Button>
          ) : activeEvents.length > 0 ? (
            <Button
              onClick={() => setShowUpload(true)}
              title={copy.activeEventsTitle(activeEvents.length)}
            >
              <Plus aria-hidden="true" />
              {copy.sharePhoto}
            </Button>
          ) : null)
        }
      />

      <div className="max-w-2xl">
        <div className="flex gap-6 overflow-x-auto border-b border-rule">
          <button
            onClick={() => setCurrentTab("posts")}
            aria-current={currentTab === "posts" ? "page" : undefined}
            className={tabClass(currentTab === "posts")}
          >
            {copy.photosTab}
          </button>

          <button
            onClick={() => setCurrentTab("results")}
            aria-current={currentTab === "results" ? "page" : undefined}
            className={tabClass(currentTab === "results")}
          >
            {copy.resultsTab}
          </button>
        </div>

        {currentTab === "posts" && Object.keys(stats.eventGroups).length > 0 && (
          <div className="flex min-w-0 flex-col gap-1.5 border-b border-rule py-4">
            <label htmlFor="social-filter" className="text-sm font-medium">
              {copy.filter}
            </label>
            <select
              id="social-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`${fieldClasses} h-control min-w-0 cursor-pointer py-2 text-sm`}
            >
              <option value="all">{copy.allEvents(stats.total)}</option>
              {Object.entries(stats.eventGroups).map(([eventId, eventData]) => (
                <option key={eventId} value={eventId}>
                  {copy.eventStats(eventData.name, eventData.count)}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <p role="status" className="py-12 text-sm text-muted-foreground">
            {copy.postsLoading}
          </p>
        ) : (
          <>
            {currentTab === "posts" && filteredPosts.length > 0 && (
              <div>
                {filteredPosts.map((post) => (
                  <ErrorBoundary key={post.id} locale={locale}>
                    <PostCard
                      post={post}
                      onPostClick={handlePostClick}
                      onDelete={handlePostDelete}
                    />
                  </ErrorBoundary>
                ))}
              </div>
            )}

            {currentTab === "results" && announcements.length > 0 && (
              <div>
                {announcements.map((announcement) => (
                  <ErrorBoundary key={announcement.id} locale={locale}>
                    <AnnouncementCard announcement={announcement} />
                  </ErrorBoundary>
                ))}
              </div>
            )}

            {currentTab === "posts" && filteredPosts.length === 0 && (
              <EmptyState
                className="mt-8"
                title={
                  activeEvents.length > 0
                    ? filter === "all"
                      ? copy.noPhotos
                      : copy.noPhotosForEvent
                    : copy.noActiveEvents
                }
                description={
                  activeEvents.length > 0 ? copy.firstPhoto : copy.noActiveEventsBody
                }
                action={
                  activeEvents.length > 0 ? (
                    <>
                      <Button onClick={() => setShowUpload(true)}>
                        {copy.sharePhoto}
                      </Button>
                      <p className="mt-4 text-sm text-muted-foreground">
                        {copy.activeEventsAvailable(activeEvents.length)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {copy.activeEventsHint}
                    </p>
                  )
                }
              />
            )}

            {currentTab === "results" && announcements.length === 0 && (
              <EmptyState
                className="mt-8"
                title={copy.noResults}
                description={copy.noResultsBody}
                action={
                  <p className="text-sm text-muted-foreground">{copy.resultsHint}</p>
                }
              />
            )}

            {((currentTab === "posts" && filteredPosts.length > 0) ||
              (currentTab === "results" && announcements.length > 0)) &&
              hasMore && (
                <div className="py-8">
                  <Button
                    variant="outline"
                    onClick={() =>
                      currentTab === "posts"
                        ? loadPosts(true)
                        : loadAnnouncements(true)
                    }
                  >
                    {copy.loadMore}
                  </Button>
                </div>
              )}
          </>
        )}
      </div>

      {showUpload && activeEvents.length > 0 && (
        <div className="fixed inset-0 z-modal flex items-center justify-center overflow-y-auto bg-ink/60 p-4">
          <PostUpload
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onDelete={handlePostDelete}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </PageContainer>
  );
}
