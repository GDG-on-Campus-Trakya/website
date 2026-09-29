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

const COPY = {
  tr: {
    title: "Sosyal Platform Yönetimi",
    subtitle: "Kullanıcı postlarını yönetin ve moderasyon yapın",
    adminPanel: "Admin Panel",
    totalPosts: "Toplam Post",
    eventPosts: "Etkinlik Postları",
    generalPosts: "Genel Postlar",
    activeUsers: "Aktif Kullanıcı",
    searchPlaceholder: "Post, kullanıcı veya etkinlik ara...",
    filterAll: (n) => `Tüm Postlar (${n})`,
    filterVisible: (n) => `Görünür Postlar (${n})`,
    filterHidden: (n) => `Gizli Postlar (${n})`,
    filterEvents: (n) => `Etkinlik Postları (${n})`,
    filterGeneral: (n) => `Genel Postlar (${n})`,
    hideAll: "Tümünü Gizle",
    showAll: "Tümünü Göster",
    refresh: "Yenile",
    noPostsFound: "Post bulunamadı",
    noPostsHint: "Arama kriterlerinizi değiştirmeyi deneyin.",
    loadPostsError: "Postlar yüklenirken hata oluştu!",
    confirmHideAll: "Tüm görünür postları gizlemek istediğinizden emin misiniz?",
    confirmShowAll: "Tüm gizli postları göstermek istediğinizden emin misiniz?",
    postsHidden: (n) => `${n} post gizlendi!`,
    postsShown: (n) => `${n} post gösterildi!`,
  },
  en: {
    title: "Social Platform Management",
    subtitle: "Manage and moderate user posts",
    adminPanel: "Admin Panel",
    totalPosts: "Total Posts",
    eventPosts: "Event Posts",
    generalPosts: "General Posts",
    activeUsers: "Active Users",
    searchPlaceholder: "Search posts, users or events...",
    filterAll: (n) => `All Posts (${n})`,
    filterVisible: (n) => `Visible Posts (${n})`,
    filterHidden: (n) => `Hidden Posts (${n})`,
    filterEvents: (n) => `Event Posts (${n})`,
    filterGeneral: (n) => `General Posts (${n})`,
    hideAll: "Hide All",
    showAll: "Show All",
    refresh: "Refresh",
    noPostsFound: "No posts found",
    noPostsHint: "Try changing your search criteria.",
    loadPostsError: "An error occurred while loading posts!",
    confirmHideAll: "Are you sure you want to hide all visible posts?",
    confirmShowAll: "Are you sure you want to show all hidden posts?",
    postsHidden: (n) => `${n} posts hidden!`,
    postsShown: (n) => `${n} posts shown!`,
  },
};

export default function AdminSocialPage() {
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
      case "events":
        filtered = filtered.filter(post => post.isEventPost);
        break;
      case "general":
        filtered = filtered.filter(post => !post.isEventPost);
        break;
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
    if (!confirm(copy.confirmHideAll)) return;

    const visiblePosts = posts.filter(post => !post.isHidden);
    let successCount = 0;

    for (const post of visiblePosts) {
      const result = await socialUtils.hidePost(post.id, true);
      if (result.success) successCount++;
    }

    toast.success(copy.postsHidden(successCount));
    loadAllPosts();
  };

  const bulkShowHidden = async () => {
    if (!confirm(copy.confirmShowAll)) return;

    const hiddenPosts = posts.filter(post => post.isHidden);
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
          <Stat label={copy.eventPosts} value={stats.eventPosts} />
          <Stat label={copy.generalPosts} value={stats.generalPosts} />
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
              type="text"
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
            <option value="events">{copy.filterEvents(posts.filter(p => p.isEventPost).length)}</option>
            <option value="general">{copy.filterGeneral(posts.filter(p => !p.isEventPost).length)}</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={bulkHideVisible}>
            <EyeOff aria-hidden="true" />
            <span>{copy.hideAll}</span>
          </Button>

          <Button variant="outline" onClick={bulkShowHidden}>
            <Eye aria-hidden="true" />
            <span>{copy.showAll}</span>
          </Button>

          <Button variant="secondary" onClick={loadAllPosts}>
            {copy.refresh}
          </Button>
        </div>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex items-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
