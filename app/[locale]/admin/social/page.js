"use client";
import { useEffect, useState } from "react";
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

export default function AdminSocialPage() {
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
      toast.error("Postlar yüklenirken hata oluştu!");
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
    if (!confirm("Tüm görünür postları gizlemek istediğinizden emin misiniz?")) return;

    const visiblePosts = posts.filter(post => !post.isHidden);
    let successCount = 0;

    for (const post of visiblePosts) {
      const result = await socialUtils.hidePost(post.id, true);
      if (result.success) successCount++;
    }

    toast.success(`${successCount} post gizlendi!`);
    loadAllPosts();
  };

  const bulkShowHidden = async () => {
    if (!confirm("Tüm gizli postları göstermek istediğinizden emin misiniz?")) return;

    const hiddenPosts = posts.filter(post => post.isHidden);
    let successCount = 0;

    for (const post of hiddenPosts) {
      const result = await socialUtils.hidePost(post.id, false);
      if (result.success) successCount++;
    }

    toast.success(`${successCount} post gösterildi!`);
    loadAllPosts();
  };

  if (loading) {
    return <p className="py-12 text-ink-2">Loading...</p>;
  }

  if (!isAdmin) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        Access Denied
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sosyal Platform Yönetimi"
        description="Kullanıcı postlarını yönetin ve moderasyon yapın"
      />

      {/* Stats */}
      {stats && (
        <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
          <Stat label="Toplam Post" value={stats.totalPosts} />
          <Stat label="Etkinlik Postları" value={stats.eventPosts} />
          <Stat label="Genel Postlar" value={stats.generalPosts} />
          <Stat label="Aktif Kullanıcı" value={stats.uniqueUsers} />
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
              placeholder="Post, kullanıcı veya etkinlik ara..."
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
            <option value="all">Tüm Postlar ({posts.length})</option>
            <option value="visible">Görünür Postlar ({posts.filter(p => !p.isHidden).length})</option>
            <option value="hidden">Gizli Postlar ({posts.filter(p => p.isHidden).length})</option>
            <option value="events">Etkinlik Postları ({posts.filter(p => p.isEventPost).length})</option>
            <option value="general">Genel Postlar ({posts.filter(p => !p.isEventPost).length})</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={bulkHideVisible}>
            <EyeOff aria-hidden="true" />
            <span>Tümünü Gizle</span>
          </Button>

          <Button variant="outline" onClick={bulkShowHidden}>
            <Eye aria-hidden="true" />
            <span>Tümünü Göster</span>
          </Button>

          <Button variant="secondary" onClick={loadAllPosts}>
            Yenile
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
              title="Post bulunamadı"
              description="Arama kriterlerinizi değiştirmeyi deneyin."
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
