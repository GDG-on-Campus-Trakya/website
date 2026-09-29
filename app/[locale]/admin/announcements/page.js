"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { announcementsUtils } from "@/utils/announcementsUtils";
import AnnouncementPostCard from "@/components/AnnouncementPostCard";
import AnnouncementForm from "@/components/AnnouncementForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Search, Plus, Eye, EyeOff } from "lucide-react";
import { logger } from "@/utils/logger";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, fieldClasses } from "@/components/ui/input";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import { useLocale } from "next-intl";
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
        title={copy.pageTitle}
        description={copy.pageSubtitle}
        actions={
          <Button
            onClick={() => {
              setSelectedAnnouncement(null);
              setShowForm(true);
            }}
          >
            <Plus aria-hidden="true" />
            <span>{copy.newAnnouncement}</span>
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <dl className="mb-10 grid grid-cols-3 gap-x-6 gap-y-4 border-b border-rule pb-8 md:max-w-xl">
          <Stat label={copy.totalAnnouncements} value={stats.totalAnnouncements} />
          <Stat label={copy.published} value={stats.publishedAnnouncements} />
          <Stat label={copy.draft} value={stats.draftAnnouncements} />
        </dl>
      )}

      {/* Controls */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={cn(fieldClasses, "h-control sm:w-auto")}
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
      </div>

      {/* Bulk Actions */}
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => bulkTogglePublish(true)}>
          <Eye aria-hidden="true" />
          <span>{copy.publishDrafts}</span>
        </Button>

        <Button variant="outline" size="sm" onClick={() => bulkTogglePublish(false)}>
          <EyeOff aria-hidden="true" />
          <span>{copy.unpublishPublished}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={loadAllAnnouncements}>
          {copy.refresh}
        </Button>
      </div>

      {/* Announcements Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="status">
          <Skeleton className="h-64" />
          <Skeleton className="hidden h-64 md:block" />
          <Skeleton className="hidden h-64 lg:block" />
        </div>
      ) : filteredAnnouncements.length > 0 ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementPostCard
              key={announcement.id}
              announcement={announcement}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showAdminActions={true}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={copy.notFound}
          description={copy.notFoundHelp}
        />
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
        theme="light"
      />
    </div>
  );
}
