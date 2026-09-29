"use client";
import { useState, useEffect } from "react";
import { announcementsUtils } from "@/utils/announcementsUtils";
import AnnouncementPostCard from "@/components/AnnouncementPostCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageContainer, PageHeader, Skeleton } from "@/components/ui/page";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";

export default function AnnouncementsClient({
  initialAnnouncements = null,
  initialHasMore = false,
}) {
  // The server sends the first page. Without it (no Firebase Admin), load it here.
  const [announcements, setAnnouncements] = useState(initialAnnouncements ?? []);
  const [isLoading, setIsLoading] = useState(!initialAnnouncements);
  const [lastDoc, setLastDoc] = useState(
    initialAnnouncements?.length
      ? { id: initialAnnouncements[initialAnnouncements.length - 1].id }
      : null
  );
  const [hasMore, setHasMore] = useState(
    initialAnnouncements ? initialHasMore : true
  );
  const [searchQuery, setSearchQuery] = useState("");
  const locale = useLocale();

  const copy =
    locale === "en"
      ? {
          title: "Announcements",
          description:
            "Find the latest updates about club events, announcements and news here.",
          searchPlaceholder: "Search announcements...",
          loading: "Loading announcements...",
          noAnnouncements: "No announcements yet",
          noAnnouncementsDescription:
            "New announcements will appear here once they are published.",
          noResults: "No results found",
          noResultsDescription: "No announcement matches your search.",
          loadMore: "Load More",
          loadError: "An error occurred while loading announcements."
        }
      : {
          title: "Duyurular",
          description:
            "Kulüp etkinlikleri, duyurular ve haberler hakkında en güncel bilgilere buradan ulaşabilirsiniz",
          searchPlaceholder: "Duyurularda ara...",
          loading: "Duyurular yükleniyor...",
          noAnnouncements: "Henüz duyuru yok",
          noAnnouncementsDescription:
            "Yeni duyurular eklendiğinde burada görüntülenecek",
          noResults: "Sonuç bulunamadı",
          noResultsDescription: "Aramanla eşleşen bir duyuru yok.",
          loadMore: "Daha Fazla Yükle",
          loadError: "Duyurular yüklenirken hata oluştu!"
        };

  useEffect(() => {
    if (!initialAnnouncements) loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAnnouncements = announcements.filter((announcement) =>
    getLocalizedField(announcement, "title", locale)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const loadAnnouncements = async (loadMore = false) => {
    if (!loadMore) setIsLoading(true);

    const result = await announcementsUtils.getAnnouncements(
      { isPublished: true },
      { limitCount: 12, startAfterDoc: loadMore ? lastDoc : null }
    );

    if (result.success) {
      if (loadMore) {
        setAnnouncements((prev) => [...prev, ...result.announcements]);
      } else {
        setAnnouncements(result.announcements);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } else {
      toast.error(copy.loadError);
    }

    setIsLoading(false);
  };

  // Without a search, the newest announcement leads the page at a larger size
  const showLead = !searchQuery && filteredAnnouncements.length > 0;
  const leadAnnouncement = showLead ? filteredAnnouncements[0] : null;
  const restAnnouncements = showLead
    ? filteredAnnouncements.slice(1)
    : filteredAnnouncements;

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.description} />

      <div className="relative mb-10 max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div aria-busy="true">
          <p className="mb-6 text-sm text-muted-foreground">{copy.loading}</p>
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="border-t-2 border-ink pt-4">
                <Skeleton className="aspect-[16/9] w-full" />
                <Skeleton className="mt-4 h-4 w-1/3" />
                <Skeleton className="mt-3 h-6 w-4/5" />
                <Skeleton className="mt-3 h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {announcements.length === 0 ? (
            <EmptyState
              title={copy.noAnnouncements}
              description={copy.noAnnouncementsDescription}
            />
          ) : filteredAnnouncements.length === 0 && searchQuery ? (
            <EmptyState
              title={copy.noResults}
              description={copy.noResultsDescription}
            />
          ) : (
            <>
              {leadAnnouncement && (
                <div className="mb-12">
                  <AnnouncementPostCard
                    announcement={leadAnnouncement}
                    showAdminActions={false}
                    featured
                  />
                </div>
              )}

              {restAnnouncements.length > 0 && (
                <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                  {restAnnouncements.map((announcement) => (
                    <AnnouncementPostCard
                      key={announcement.id}
                      announcement={announcement}
                      showAdminActions={false}
                    />
                  ))}
                </div>
              )}

              {!searchQuery && hasMore && (
                <div className="mt-12 flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => loadAnnouncements(true)}
                  >
                    {copy.loadMore}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
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
    </PageContainer>
  );
}
