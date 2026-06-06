"use client";
import { useState, useEffect } from "react";
import { announcementsUtils } from "@/utils/announcementsUtils";
import AnnouncementPostCard from "@/components/AnnouncementPostCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
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
    loadAnnouncements();
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

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-[1.2] pb-3">
            {copy.title}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            {copy.description}
          </p>
        </motion.div>

        <div className="mb-8 sm:mb-12">
          <div className="relative max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-400 text-sm">{copy.loading}</p>
          </div>
        ) : (
          <>
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-xl max-w-md mx-auto">
                  <div className="text-6xl mb-4">📢</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {copy.noAnnouncements}
                  </h3>
                  <p className="text-gray-400">{copy.noAnnouncementsDescription}</p>
                </div>
              </div>
            ) : filteredAnnouncements.length === 0 && searchQuery ? (
              <div className="text-center py-12">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-xl max-w-md mx-auto">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {copy.noResults}
                  </h3>
                  <p className="text-gray-400">{copy.noResultsDescription}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredAnnouncements.map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AnnouncementPostCard
                        announcement={announcement}
                        showAdminActions={false}
                      />
                    </motion.div>
                  ))}
                </div>

                {!searchQuery && hasMore && (
                  <div className="flex justify-center py-6">
                    <button
                      onClick={() => loadAnnouncements(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium"
                    >
                      {copy.loadMore}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

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
  );
}
