'use client';
import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { announcementsUtils } from '@/utils/announcementsUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Calendar, User, Clock, Share2, Linkedin, ChevronRight, Instagram } from 'lucide-react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { formatLocalizedDate, getLocalizedField } from '@/utils/localeUtils';
import { Button } from '@/components/ui/button';
import { PageContainer, Section } from '@/components/ui/page';

const COPY = {
  tr: {
    notPublished: "Bu duyuru yayında değil!",
    notFound: "Duyuru bulunamadı!",
    loading: "Duyuru yükleniyor...",
    home: "Ana Sayfa",
    announcements: "Duyurular",
    noContent: "Bu duyuru için içerik bulunmuyor.",
    details: "Duyuru Bilgileri",
    author: "Yazar",
    published: "Yayınlanma",
    updated: "Güncellenme",
    share: "Paylaş",
    recent: "Son Duyurular",
  },
  en: {
    notPublished: "This announcement is not published!",
    notFound: "Announcement not found!",
    loading: "Loading announcement...",
    home: "Home",
    announcements: "Announcements",
    noContent: "This announcement has no content.",
    details: "Announcement Details",
    author: "Author",
    published: "Published",
    updated: "Updated",
    share: "Share",
    recent: "Recent Announcements",
  },
};

export default function AnnouncementDetailClient({
  initialAnnouncement = null,
  initialRecent = [],
}) {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const copy = COPY[locale === "en" ? "en" : "tr"];
  // The server sends the announcement; without it (no Firebase Admin), load it here.
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [recentAnnouncements, setRecentAnnouncements] = useState(initialRecent);
  const [isLoading, setIsLoading] = useState(!initialAnnouncement);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (params.id && !initialAnnouncement) {
      loadAnnouncement();
      loadRecentAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadAnnouncement = async () => {
    setIsLoading(true);
    const result = await announcementsUtils.getAnnouncementById(params.id);
    if (result.success) {
      if (!result.announcement.isPublished) {
        toast.error(copy.notPublished);
        router.push('/announcements');
        return;
      }
      setAnnouncement(result.announcement);
    } else {
      toast.error(copy.notFound);
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
      <PageContainer>
        <p role="status" className="text-sm text-muted-foreground">{copy.loading}</p>
      </PageContainer>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <PageContainer>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <li className="shrink-0">
            <Link href="/" className="whitespace-nowrap rounded-sm hover:text-ink hover:underline hover:underline-offset-4">
              {copy.home}
            </Link>
          </li>
          <li className="shrink-0"><ChevronRight className="h-4 w-4" aria-hidden="true" /></li>
          <li className="shrink-0">
            <Link href="/announcements" className="whitespace-nowrap rounded-sm hover:text-ink hover:underline hover:underline-offset-4">
              {copy.announcements}
            </Link>
          </li>
          <li className="shrink-0"><ChevronRight className="h-4 w-4" aria-hidden="true" /></li>
          {/* Uzun başlık: shrink kaldırıldı, ellipsis aktif */}
          <li className="min-w-0">
            <span className="block max-w-[40vw] truncate text-ink sm:max-w-[60vw] lg:max-w-[40ch]">
              {announcementTitle}
            </span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
        {/* Main Content */}
        <article className="min-w-0">
          <h1 className="break-words text-4xl font-extrabold leading-tight">
            {announcementTitle}
          </h1>
          {announcement.imageUrl && !imageError && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-lg bg-paper-2">
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
          <div className="mt-6 max-w-measure whitespace-pre-wrap break-words leading-relaxed text-ink-2 [overflow-wrap:anywhere]">
            {announcementContent}
          </div>
          {!announcementContent && (
            <p className="text-sm italic text-muted-foreground">{copy.noContent}</p>
          )}
        </article>

        {/* Sidebar */}
        <aside className="min-w-0">
          {/* Author & Date */}
          <Section title={copy.details} className="mt-0 md:mt-0">
            <dl className="space-y-4 text-sm">
              {announcement.authorName && (
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs text-muted-foreground">{copy.author}</dt>
                    <dd className="break-words font-medium">{announcement.authorName}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs text-muted-foreground">{copy.published}</dt>
                  <dd className="break-words font-outlier">{formatDate(announcement.createdAt)}</dd>
                </div>
              </div>
              {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs text-muted-foreground">{copy.updated}</dt>
                    <dd className="break-words font-outlier">{formatDate(announcement.updatedAt)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Section>

          {/* Share */}
          <Section title={copy.share} className="mt-8 md:mt-8">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={shareOnX} aria-label="X">
                <svg width="20" height="20" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="currentColor"/>
                </svg>
              </Button>
              <Button variant="outline" className="flex-1" onClick={shareOnLinkedIn} aria-label="LinkedIn">
                <Linkedin className="!size-5 text-[#0A66C2]" aria-hidden="true" />
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="https://www.instagram.com/gdgoncampustu/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="!size-5 text-[#E1306C]" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </Section>

          {/* Recent Announcements */}
          {recentAnnouncements.length > 0 && (
            <Section title={copy.recent} className="mt-8 md:mt-8">
              <ul>
                {recentAnnouncements.map(item => (
                  <li key={item.id}>
                    <Link
                      href={`/announcements/${item.id}`}
                      className="group block border-b border-rule py-3 transition-colors duration-micro ease-out hover:bg-paper-2"
                    >
                      <p className="line-clamp-2 font-medium group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                        {getLocalizedField(item, 'title', locale)}
                      </p>
                      <p className="mt-1 font-outlier text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </aside>
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
        theme="light"
      />
    </PageContainer>
  );
}
