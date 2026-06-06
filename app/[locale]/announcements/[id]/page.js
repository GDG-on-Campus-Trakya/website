'use client';
import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { announcementsUtils } from '@/utils/announcementsUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, Share2, Linkedin, ChevronRight, Instagram } from 'lucide-react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { formatLocalizedDate, getLocalizedField } from '@/utils/localeUtils';

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const [announcement, setAnnouncement] = useState(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadAnnouncement();
      loadRecentAnnouncements();
    }
  }, [params.id]);

  const loadAnnouncement = async () => {
    setIsLoading(true);
    const result = await announcementsUtils.getAnnouncementById(params.id);
    if (result.success) {
      if (!result.announcement.isPublished) {
        toast.error('Bu duyuru yayında değil!');
        router.push('/announcements');
        return;
      }
      setAnnouncement(result.announcement);
    } else {
      toast.error('Duyuru bulunamadı!');
      router.push('/announcements');
    }
    setIsLoading(false);
  };

  const loadRecentAnnouncements = async () => {
    const result = await announcementsUtils.getAnnouncements({ isPublished: true }, { limitCount: 5 });
    if (result.success) {
      setRecentAnnouncements(result.announcements.filter(item => item.id !== params.id));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return locale === 'en' ? 'No date' : 'Tarih yok';
    try {
      return formatLocalizedDate(dateString, locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return locale === 'en' ? 'No date' : 'Tarih yok';
    }
  };

  const announcementTitle = getLocalizedField(announcement, 'title', locale);
  const announcementDescription = getLocalizedField(
    announcement,
    'description',
    locale
  );
  const announcementContent =
    getLocalizedField(announcement, 'content', locale) || announcementDescription;

  const shareOnX = () => {
    const text = encodeURIComponent(announcementTitle);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white items-center justify-center px-4">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-2 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-400 text-xs sm:text-sm text-center">Duyuru yükleniyor...</p>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24">
        {/* Breadcrumbs */}
<nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
  <ol className="flex items-center gap-1 text-xs sm:text-sm text-gray-400 min-w-0">
    <li className="shrink-0">
      <Link href="/" className="hover:text-white transition-colors whitespace-nowrap">
        Ana Sayfa
      </Link>
    </li>
    <li className="shrink-0"><ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" /></li>
    <li className="shrink-0">
      <Link href="/announcements" className="hover:text-white transition-colors whitespace-nowrap">
        Duyurular
      </Link>
    </li>
    <li className="shrink-0"><ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" /></li>
    {/* Uzun başlık: shrink kaldırıldı, ellipsis aktif */}
    <li className="min-w-0">
      <span className="text-white block truncate max-w-[40vw] sm:max-w-[60vw] lg:max-w-[40ch]">
        {announcementTitle}
      </span>
    </li>
  </ol>
</nav>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Main Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gray-800/30 backdrop-blur-md rounded-xl sm:rounded-2xl overflow-hidden border border-gray-700 shadow-2xl"
          >
            {announcement.imageUrl && !imageError && (
              <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-900">
                <Image
                  src={announcement.imageUrl}
                  alt={announcementTitle}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  priority
                />
              </div>
            )}
            <div className="p-4 sm:p-6 lg:p-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight break-words">
                {announcementTitle}
              </h1>
              <div className="prose prose-sm sm:prose-base lg:prose-lg prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {announcementContent}
              </div>
              {!announcementContent && (
                <p className="text-gray-400 italic text-sm sm:text-base">Bu duyuru için içerik bulunmuyor.</p>
              )}
            </div>
          </motion.article>

          {/* Sidebar */}
          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Author & Date */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Duyuru Bilgileri</h3>
              <div className="space-y-3 sm:space-y-4 text-sm">
                {announcement.authorName && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-400 text-xs sm:text-sm">Yazar</span>
                      <p className="text-white font-medium text-sm sm:text-base break-words">{announcement.authorName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-gray-400 text-xs sm:text-sm">Yayınlanma</span>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{formatDate(announcement.createdAt)}</p>
                  </div>
                </div>
                {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-400 text-xs sm:text-sm">Güncellenme</span>
                      <p className="text-white font-medium text-sm sm:text-base break-words">{formatDate(announcement.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Paylaş</h3>
              <div className="flex gap-4">
                <button onClick={shareOnX} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                  <svg width="20" height="20" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="white"/>
                  </svg>
                </button>
                <button onClick={shareOnLinkedIn} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                  <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                </button>
                <a href="https://www.instagram.com/gdgoncampustu/" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                  <Instagram className="w-5 h-5 text-[#E1306C]" />
                </a>
              </div>
            </div>

            {/* Recent Announcements */}
            {recentAnnouncements.length > 0 && (
              <div className="bg-gray-800/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Son Duyurular</h3>
                <div className="space-y-3 sm:space-y-4">
                  {recentAnnouncements.map(item => (
                    <Link key={item.id} href={`/announcements/${item.id}`}>
                      <div className="block p-3 sm:p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                        <p className="font-medium text-white text-sm sm:text-base line-clamp-2 mb-1">
                          {getLocalizedField(item, 'title', locale)}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        </div>
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
