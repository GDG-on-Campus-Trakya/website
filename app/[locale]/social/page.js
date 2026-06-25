"use client";

import { useState, useEffect } from "react";
import { Plus, Filter, Calendar, Trophy } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { socialUtils } from "@/utils/socialUtils";
import PostCard from "@/components/PostCard";
import PostModal from "@/components/PostModal";
import PostUpload from "@/components/PostUpload";
import AnnouncementCard from "@/components/AnnouncementCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRouter } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";

export default function SocialPage() {
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
      router.push("/");
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">{copy.loading}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">{copy.signInRequired}</div>
      </div>
    );
  }

  const stats = getFilterStats();

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
            {copy.title}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">{copy.subtitle}</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-6 border border-gray-700">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setCurrentTab("posts")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                currentTab === "posts"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{copy.photosTab}</span>
            </button>

            <button
              onClick={() => setCurrentTab("results")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                currentTab === "results"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30"
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>{copy.resultsTab}</span>
            </button>
          </div>

          {currentTab === "posts" && Object.keys(stats.eventGroups).length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Filter className="w-4 h-4" />
                <span>{copy.filter}</span>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:flex-1 max-w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-gray-700"
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
        </div>

        {currentTab === "posts" &&
          (loadingEvents ? (
            <div className="fixed bottom-6 right-6 bg-gray-600 p-4 rounded-full shadow-2xl z-50">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            </div>
          ) : activeEvents.length > 0 ? (
            <button
              onClick={() => setShowUpload(true)}
              className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full hover:bg-blue-700 transition-all shadow-2xl hover:scale-110 z-50"
              title={copy.activeEventsTitle(activeEvents.length)}
            >
              <Plus className="w-6 h-6" />
            </button>
          ) : null)}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4" />
            <p className="text-[#d1d1e0] text-sm">{copy.postsLoading}</p>
          </div>
        ) : (
          <>
            {currentTab === "posts" && filteredPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                  <ErrorBoundary key={announcement.id} locale={locale}>
                    <AnnouncementCard announcement={announcement} />
                  </ErrorBoundary>
                ))}
              </div>
            )}

            {((currentTab === "posts" && filteredPosts.length === 0) ||
              (currentTab === "results" && announcements.length === 0)) && (
              <div className="text-center py-12">
                <div className="relative mx-auto rounded-xl bg-gray-800/50 backdrop-blur-sm p-8 shadow-xl max-w-md">
                  {currentTab === "posts" ? (
                    activeEvents.length > 0 ? (
                      <>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {filter === "all"
                            ? copy.noPhotos
                            : copy.noPhotosForEvent}
                        </h3>
                        <p className="text-[#d1d1e0] mb-4">{copy.firstPhoto}</p>
                        <button
                          onClick={() => setShowUpload(true)}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
                        >
                          {copy.sharePhoto}
                        </button>
                        <div className="mt-4 text-sm text-gray-400">
                          {"\u{1F3AF}"}{" "}
                          {copy.activeEventsAvailable(activeEvents.length)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">{"\u{1F4F8}"}</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {copy.noActiveEvents}
                        </h3>
                        <p className="text-[#d1d1e0] mb-4">
                          {copy.noActiveEventsBody}
                        </p>
                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mt-4">
                          <p className="text-blue-300 text-sm">
                            {"\u{1F4A1}"} {copy.activeEventsHint}
                          </p>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <div className="text-6xl mb-4">{"\u{1F3C6}"}</div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {copy.noResults}
                      </h3>
                      <p className="text-[#d1d1e0] mb-4">{copy.noResultsBody}</p>
                      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 mt-4">
                        <p className="text-yellow-300 text-sm">
                          {"\u{1F389}"} {copy.resultsHint}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {((currentTab === "posts" && filteredPosts.length > 0) ||
              (currentTab === "results" && announcements.length > 0)) &&
              hasMore && (
                <div className="flex justify-center py-6 mt-6">
                  <button
                    onClick={() =>
                      currentTab === "posts"
                        ? loadPosts(true)
                        : loadAnnouncements(true)
                    }
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg"
                  >
                    {copy.loadMore}
                  </button>
                </div>
              )}
          </>
        )}

        {showUpload && activeEvents.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
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
          theme="dark"
        />
      </div>
    </div>
  );
}
