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
import { Search, Filter, BarChart3, Eye, EyeOff, Trash2, ArrowLeft } from "lucide-react";
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-gray-200">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>
            <div className="border-l border-gray-500 h-8"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                Sosyal Platform Yönetimi
              </h1>
              <p className="text-gray-300">
                Kullanıcı postlarını yönetin ve moderasyon yapın
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Toplam Post</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.totalPosts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Etkinlik Postları</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.eventPosts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Filter className="w-8 h-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Genel Postlar</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.generalPosts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Aktif Kullanıcı</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.uniqueUsers}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Post, kullanıcı veya etkinlik ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/60 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700/60 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="all">Tüm Postlar ({posts.length})</option>
              <option value="visible">Görünür Postlar ({posts.filter(p => !p.isHidden).length})</option>
              <option value="hidden">Gizli Postlar ({posts.filter(p => p.isHidden).length})</option>
              <option value="events">Etkinlik Postları ({posts.filter(p => p.isEventPost).length})</option>
              <option value="general">Genel Postlar ({posts.filter(p => !p.isEventPost).length})</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={bulkHideVisible}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
            >
              <EyeOff className="w-4 h-4" />
              <span>Tümünü Gizle</span>
            </button>
            
            <button
              onClick={bulkShowHidden}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Tümünü Göster</span>
            </button>
            
            <button
              onClick={loadAllPosts}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yenile
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-800 rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    Post bulunamadı
                  </h3>
                  <p className="text-gray-300">
                    Arama kriterlerinizi değiştirmeyi deneyin.
                  </p>
                </div>
              </div>
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
    </div>
  );
}