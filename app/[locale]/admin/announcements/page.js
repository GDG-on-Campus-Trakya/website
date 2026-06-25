"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { announcementsUtils } from "@/utils/announcementsUtils";
import AnnouncementPostCard from "@/components/AnnouncementPostCard";
import AnnouncementForm from "@/components/AnnouncementForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  Filter,
  Plus,
  BarChart3,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { logger } from "@/utils/logger";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    backToAdmin: "Admin Panel",
    pageTitle: "Duyurular Yönetimi",
    pageSubtitle: "Duyuruları oluşturun, düzenleyin ve yönetin",
    totalAnnouncements: "Toplam Duyuru",
    published: "Yayında",
    draft: "Taslak",
    searchPlaceholder: "Duyuru ara...",
    filterAll: (n) => `Tümü (${n})`,
    filterPublished: (n) => `Yayında (${n})`,
    filterDraft: (n) => `Taslak (${n})`,
    newAnnouncement: "Yeni Duyuru",
    publishDrafts: "Taslakları Yayınla",
    unpublishPublished: "Yayındakileri Taslağa Al",
    refresh: "Yenile",
    notFound: "Duyuru bulunamadı",
    notFoundHelp:
      "Arama kriterlerinizi değiştirmeyi deneyin veya yeni bir duyuru oluşturun.",
    loadError: "Duyurular yüklenirken hata oluştu!",
    confirmDelete: "Bu duyuruyu silmek istediğinizden emin misiniz?",
    deleteOk: "Duyuru başarıyla silindi!",
    deleteError: "Duyuru silinirken hata oluştu!",
    noTargets: "İşlem yapılacak duyuru yok!",
    confirmBulkToggle: (count, publish) =>
      `${count} duyuruyu ${
        publish ? "yayınlamak" : "taslağa almak"
      } istediğinizden emin misiniz?`,
    bulkToggleOk: (count) => `${count} duyuru güncellendi!`,
  },
  en: {
    backToAdmin: "Admin Panel",
    pageTitle: "Announcements Management",
    pageSubtitle: "Create, edit and manage announcements",
    totalAnnouncements: "Total Announcements",
    published: "Published",
    draft: "Draft",
    searchPlaceholder: "Search announcements...",
    filterAll: (n) => `All (${n})`,
    filterPublished: (n) => `Published (${n})`,
    filterDraft: (n) => `Draft (${n})`,
    newAnnouncement: "New Announcement",
    publishDrafts: "Publish Drafts",
    unpublishPublished: "Move Published to Draft",
    refresh: "Refresh",
    notFound: "No announcements found",
    notFoundHelp:
      "Try changing your search criteria or create a new announcement.",
    loadError: "An error occurred while loading announcements!",
    confirmDelete: "Are you sure you want to delete this announcement?",
    deleteOk: "Announcement deleted successfully!",
    deleteError: "An error occurred while deleting the announcement!",
    noTargets: "No announcements to process!",
    confirmBulkToggle: (count, publish) =>
      `Are you sure you want to ${
        publish ? "publish" : "move to draft"
      } ${count} announcement(s)?`,
    bulkToggleOk: (count) => `${count} announcement(s) updated!`,
  },
};

export default function AdminDuyurularPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "published", "draft"
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

  // Load announcements and stats
  useEffect(() => {
    if (isAdmin) {
      loadAllAnnouncements();
      loadStats();
    }
  }, [isAdmin]);

  // Apply filters and search
  useEffect(() => {
    applyFiltersAndSearch();
  }, [announcements, filter, searchTerm]);

  const loadAllAnnouncements = async () => {
    setIsLoading(true);

    // Load all announcements including drafts
    const result = await announcementsUtils.getAnnouncements(
      { isPublished: null },
      { limitCount: 100 }
    );

    if (result.success) {
      setAnnouncements(result.announcements);
    } else {
      toast.error(copy.loadError);
    }

    setIsLoading(false);
  };

  const loadStats = async () => {
    const result = await announcementsUtils.getAnnouncementsStats();
    if (result.success) {
      setStats(result.stats);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = announcements;

    // Apply filter
    switch (filter) {
      case "published":
        filtered = filtered.filter((a) => a.isPublished);
        break;
      case "draft":
        filtered = filtered.filter((a) => !a.isPublished);
        break;
      default:
        // "all" - no filter
        break;
    }

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (announcement) =>
          announcement.title?.toLowerCase().includes(search) ||
          announcement.description?.toLowerCase().includes(search) ||
          announcement.content?.toLowerCase().includes(search) ||
          announcement.authorName?.toLowerCase().includes(search)
      );
    }

    setFilteredAnnouncements(filtered);
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (announcementId) => {
    if (!confirm(copy.confirmDelete)) return;

    const result = await announcementsUtils.deleteAnnouncement(announcementId);

    if (result.success) {
      toast.success(copy.deleteOk);
      setAnnouncements((prev) =>
        prev.filter((a) => a.id !== announcementId)
      );
      loadStats(); // Refresh stats
    } else {
      toast.error(copy.deleteError);
    }
  };

  const handleFormSuccess = () => {
    loadAllAnnouncements();
    loadStats();
    setShowForm(false);
    setSelectedAnnouncement(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedAnnouncement(null);
  };

  const bulkTogglePublish = async (publish) => {
    const targetAnnouncements = announcements.filter(
      (a) => publish ? !a.isPublished : a.isPublished
    );

    if (targetAnnouncements.length === 0) {
      toast.info(copy.noTargets);
      return;
    }

    if (
      !confirm(copy.confirmBulkToggle(targetAnnouncements.length, publish))
    )
      return;

    let successCount = 0;

    for (const announcement of targetAnnouncements) {
      const result = await announcementsUtils.togglePublishStatus(
        announcement.id,
        publish
      );
      if (result.success) successCount++;
    }

    toast.success(copy.bulkToggleOk(successCount));
    loadAllAnnouncements();
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-gray-200">{a.loading}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">{a.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{copy.backToAdmin}</span>
            </button>
            <div className="border-l border-gray-500 h-8"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                {copy.pageTitle}
              </h1>
              <p className="text-gray-300">
                {copy.pageSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">
                    {copy.totalAnnouncements}
                  </p>
                  <p className="text-2xl font-bold text-gray-100">
                    {stats.totalAnnouncements}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">
                    {copy.published}
                  </p>
                  <p className="text-2xl font-bold text-gray-100">
                    {stats.publishedAnnouncements}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <EyeOff className="w-8 h-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">{copy.draft}</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {stats.draftAnnouncements}
                  </p>
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
                  placeholder={copy.searchPlaceholder}
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
              <option value="all">
                {copy.filterAll(announcements.length)}
              </option>
              <option value="published">
                {copy.filterPublished(announcements.filter((a) => a.isPublished).length)}
              </option>
              <option value="draft">
                {copy.filterDraft(announcements.filter((a) => !a.isPublished).length)}
              </option>
            </select>

            {/* Create Button */}
            <button
              onClick={() => {
                setSelectedAnnouncement(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>{copy.newAnnouncement}</span>
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => bulkTogglePublish(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              <span>{copy.publishDrafts}</span>
            </button>

            <button
              onClick={() => bulkTogglePublish(false)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <EyeOff className="w-4 h-4" />
              <span>{copy.unpublishPublished}</span>
            </button>

            <button
              onClick={loadAllAnnouncements}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              {copy.refresh}
            </button>
          </div>
        </div>

        {/* Announcements Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <AnnouncementPostCard
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showAdminActions={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-800 rounded-lg p-8">
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    {copy.notFound}
                  </h3>
                  <p className="text-gray-300">
                    {copy.notFoundHelp}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Announcement Form Modal */}
        {showForm && (
          <AnnouncementForm
            announcement={selectedAnnouncement}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}

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
