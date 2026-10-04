"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { socialUtils } from "@/utils/socialUtils";
import PostCard from "@/components/PostCard";
import { logger } from "@/utils/logger";
import PostModal from "@/components/PostModal";
import { Search, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, fieldClasses } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import { cn } from "@/lib/utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminCopy } from "@/utils/adminCopy";
import { useConfirm } from "@/components/ConfirmProvider";

const COPY = {
  tr: {
    title: "Sosyal",
    subtitle: "Etkinliklerde paylaşılan fotoğrafları gizle, göster ya da sil.",
    adminPanel: "Yönetim paneli",
    totalPosts: "Gönderi",
    hiddenPosts: "Gizli",
    eventsWithPosts: "Fotoğraf paylaşılan etkinlik",
    activeUsers: "Paylaşan kişi",
    searchPlaceholder: "Açıklama, kişi ya da etkinlik ara",
    filterAll: (n) => `Tümü (${n})`,
    filterVisible: (n) => `Görünenler (${n})`,
    filterHidden: (n) => `Gizliler (${n})`,
    hideAll: (n) => `Görünen ${n} gönderiyi gizle`,
    showAll: (n) => `Gizli ${n} gönderiyi göster`,
    refresh: "Yenile",
    noPostsFound: "Gönderi bulunamadı",
    noPostsHint: "Aramayı ya da filtreyi değiştir.",
    loadPostsError: "Gönderiler yüklenemedi. Yeniden dene.",
    confirmHideAll: (n) => `Görünen ${n} gönderinin hepsi gizlensin mi?`,
    confirmShowAll: (n) => `Gizli ${n} gönderinin hepsi gösterilsin mi?`,
    postsHidden: (n) => `${n} gönderi gizlendi.`,
    postsShown: (n) => `${n} gönderi gösterildi.`,
  },
  en: {
    title: "Social",
    subtitle: "Hide, show or delete the photos shared at events.",
    adminPanel: "Admin panel",
    totalPosts: "Posts",
    hiddenPosts: "Hidden",
    eventsWithPosts: "Events with photos",
    activeUsers: "People who posted",
    searchPlaceholder: "Search captions, people or events",
    filterAll: (n) => `All (${n})`,
    filterVisible: (n) => `Visible (${n})`,
    filterHidden: (n) => `Hidden (${n})`,
    hideAll: (n) => `Hide the ${n} visible posts`,
    showAll: (n) => `Show the ${n} hidden posts`,
    refresh: "Refresh",
    noPostsFound: "No posts found",
    noPostsHint: "Change the search or the filter.",
    loadPostsError: "The posts could not be loaded. Try again.",
    confirmHideAll: (n) => `Hide all ${n} visible posts?`,
    confirmShowAll: (n) => `Show all ${n} hidden posts?`,
    postsHidden: (n) => `${n} posts hidden.`,
    postsShown: (n) => `${n} posts shown.`,
  },
};

export default function AdminSocialPage() {
  const confirm = useConfirm();
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "events", "general", "hidden"
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const router = useRouter();

  // Check admin privileges
  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setIsAdmin(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        logger.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  // Load posts and stats
  useEffect(() => {
    if (isAdmin) {
      loadAllPosts();
      loadStats();
    }
  }, [isAdmin]);

  // Apply filters and search
  useEffect(() => {
    applyFiltersAndSearch();
  }, [posts, filter, searchTerm]);

  const loadAllPosts = async () => {
    setIsLoading(true);

    // Load all posts including hidden ones
    const result = await socialUtils.getPosts({}, { limit: 100 });

    if (result.success) {
      setPosts(result.posts);
    } else {
      toast.error(copy.loadPostsError);
    }

    setIsLoading(false);
  };

  const loadStats = async () => {
    const result = await socialUtils.getPostStats();
    if (result.success) {
      setStats(result.stats);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = posts;

    // Apply filter
    switch (filter) {
      case "hidden":
        filtered = filtered.filter(post => post.isHidden);
        break;
      case "visible":
        filtered = filtered.filter(post => !post.isHidden);
        break;
      default:
        // "all" - no filter
        break;
    }

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(post =>
        post.description?.toLowerCase().includes(search) ||
        post.userName?.toLowerCase().includes(search) ||
        post.userEmail?.toLowerCase().includes(search) ||
        post.eventName?.toLowerCase().includes(search)
      );
    }

    setFilteredPosts(filtered);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    loadStats(); // Refresh stats
  };

  const bulkHideVisible = async () => {
    const visiblePosts = posts.filter(post => !post.isHidden);
    if (!(await confirm(copy.confirmHideAll(visiblePosts.length)))) return;

    let successCount = 0;

    for (const post of visiblePosts) {
      const result = await socialUtils.hidePost(post.id, true);
      if (result.success) successCount++;
    }

    toast.success(copy.postsHidden(successCount));
    loadAllPosts();
  };

  const bulkShowHidden = async () => {
    const hiddenPosts = posts.filter(post => post.isHidden);
    if (!(await confirm(copy.confirmShowAll(hiddenPosts.length)))) return;

    let successCount = 0;

    for (const post of hiddenPosts) {
      const result = await socialUtils.hidePost(post.id, false);
      if (result.success) successCount++;
    }

    toast.success(copy.postsShown(successCount));
    loadAllPosts();
  };

  if (loading) {
    return <p className="py-12 text-ink-2">{a.loading}</p>;
  }

  if (!isAdmin) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        {a.accessDenied}
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title={copy.title}
        description={copy.subtitle}
      />

      {/* Stats */}
      {stats && (
        <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
          <Stat label={copy.totalPosts} value={stats.totalPosts} />
          <Stat label={copy.hiddenPosts} value={posts.filter((post) => post.isHidden).length} />
          <Stat
            label={copy.eventsWithPosts}
            value={new Set(posts.map((post) => post.eventId).filter(Boolean)).size}
          />
          <Stat label={copy.activeUsers} value={stats.uniqueUsers} />
        </dl>
      )}

      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 border-y border-rule py-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label={copy.searchPlaceholder}
              placeholder={copy.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={cn(fieldClasses, "h-control sm:w-auto")}
          >
            <option value="all">{copy.filterAll(posts.length)}</option>
            <option value="visible">{copy.filterVisible(posts.filter(p => !p.isHidden).length)}</option>
            <option value="hidden">{copy.filterHidden(posts.filter(p => p.isHidden).length)}</option>
          </select>
        </div>

        {/* Bulk actions act on the filtered set, so they appear only with that filter */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={loadAllPosts}>
            {copy.refresh}
          </Button>
          {filter === "visible" && posts.some((post) => !post.isHidden) && (
            <Button variant="outline" onClick={bulkHideVisible}>
              <EyeOff aria-hidden="true" />
              <span>{copy.hideAll(posts.filter((post) => !post.isHidden).length)}</span>
            </Button>
          )}
          {filter === "hidden" && posts.some((post) => post.isHidden) && (
            <Button variant="outline" onClick={bulkShowHidden}>
              <Eye aria-hidden="true" />
              <span>{copy.showAll(posts.filter((post) => post.isHidden).length)}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex items-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostClick={handlePostClick}
                onDelete={handlePostDelete}
                showAdminActions={true}
              />
            ))
          ) : (
            <EmptyState
              className="col-span-full"
              title={copy.noPostsFound}
              description={copy.noPostsHint}
            />
          )}
        </div>
      )}

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onDelete={handlePostDelete}
        showAdminActions={true}
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
    </div>
  );
}
