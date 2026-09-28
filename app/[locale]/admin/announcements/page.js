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

export default function AdminDuyurularPage() {
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
      toast.error("Duyurular yüklenirken hata oluştu!");
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
    if (
      !confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")
    )
      return;

    const result = await announcementsUtils.deleteAnnouncement(announcementId);

    if (result.success) {
      toast.success(result.message);
      setAnnouncements((prev) =>
        prev.filter((a) => a.id !== announcementId)
      );
      loadStats(); // Refresh stats
    } else {
      toast.error(result.message);
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
      toast.info("İşlem yapılacak duyuru yok!");
      return;
    }

    if (
      !confirm(
        `${targetAnnouncements.length} duyuruyu ${
          publish ? "yayınlamak" : "taslağa almak"
        } istediğinizden emin misiniz?`
      )
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

    toast.success(`${successCount} duyuru güncellendi!`);
    loadAllAnnouncements();
    loadStats();
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
        title="Duyurular Yönetimi"
        description="Duyuruları oluşturun, düzenleyin ve yönetin"
        actions={
          <Button
            onClick={() => {
              setSelectedAnnouncement(null);
              setShowForm(true);
            }}
          >
            <Plus aria-hidden="true" />
            <span>Yeni Duyuru</span>
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <dl className="mb-10 grid grid-cols-3 gap-x-6 gap-y-4 border-b border-rule pb-8 md:max-w-xl">
          <Stat label="Toplam Duyuru" value={stats.totalAnnouncements} />
          <Stat label="Yayında" value={stats.publishedAnnouncements} />
          <Stat label="Taslak" value={stats.draftAnnouncements} />
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
            placeholder="Duyuru ara..."
            aria-label="Duyuru ara..."
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
            Tümü ({announcements.length})
          </option>
          <option value="published">
            Yayında ({announcements.filter((a) => a.isPublished).length})
          </option>
          <option value="draft">
            Taslak ({announcements.filter((a) => !a.isPublished).length})
          </option>
        </select>
      </div>

      {/* Bulk Actions */}
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => bulkTogglePublish(true)}>
          <Eye aria-hidden="true" />
          <span>Taslakları Yayınla</span>
        </Button>

        <Button variant="outline" size="sm" onClick={() => bulkTogglePublish(false)}>
          <EyeOff aria-hidden="true" />
          <span>Yayındakileri Taslağa Al</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={loadAllAnnouncements}>
          Yenile
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
          title="Duyuru bulunamadı"
          description="Arama kriterlerinizi değiştirmeyi deneyin veya yeni bir duyuru oluşturun."
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
