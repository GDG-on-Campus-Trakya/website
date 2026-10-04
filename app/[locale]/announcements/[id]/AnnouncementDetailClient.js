'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronRight, Link2, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import {
  formatLocalizedDate,
  getLocalizedField,
  withYearIfNotCurrent,
} from '@/utils/localeUtils';
import { plainTextToMarkdown } from '@/utils/plainTextMarkdown';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer, Section } from '@/components/ui/page';

const MarkdownRenderer = dynamic(() => import('@/components/MarkdownRenderer'));

const COPY = {
  tr: {
    notFound: "Bu duyuru yok ya da yayından kaldırılmış.",
    backToList: "Tüm duyurular",
    loading: "Duyuru yükleniyor…",
    home: "Ana sayfa",
    announcements: "Duyurular",
    noContent: "Bu duyurunun metni yok.",
    by: "Yazan",
    updated: "Güncellendi",
    share: "Paylaş",
    shareNative: "Paylaş",
    copyLink: "Bağlantıyı kopyala",
    copied: "Bağlantı kopyalandı.",
    copyFailed: "Kopyalanamadı; adres çubuğundaki bağlantıyı kullan.",
    recent: "Son duyurular",
  },
  en: {
    notFound: "This announcement does not exist or has been taken down.",
    backToList: "All announcements",
    loading: "Loading announcement…",
    home: "Home",
    announcements: "Announcements",
    noContent: "This announcement has no text.",
    by: "By",
    updated: "Updated",
    share: "Share",
    shareNative: "Share",
    copyLink: "Copy link",
    copied: "Link copied.",
    copyFailed: "Could not copy; use the link in the address bar.",
    recent: "Recent announcements",
  },
};

const shareLink =
  "inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2";

export default function AnnouncementDetailClient({
  initialAnnouncement = null,
  initialRecent = [],
}) {
  const params = useParams();
  const locale = useLocale();
  const copy = COPY[locale === "en" ? "en" : "tr"];
  // The server sends the announcement; without it (no Firebase Admin), load it here.
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [recentAnnouncements, setRecentAnnouncements] = useState(initialRecent);
  const [isLoading, setIsLoading] = useState(!initialAnnouncement);
  const [missing, setMissing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  // Known only in the browser; share links are completed after hydration.
  const [pageUrl, setPageUrl] = useState('');
  const [copyStatus, setCopyStatus] = useState(null);

  useEffect(() => {
    if (params.id && !initialAnnouncement) {
      loadAnnouncement();
      loadRecentAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === 'function');
    setPageUrl(window.location.href);
  }, []);

  const loadAnnouncement = async () => {
    setIsLoading(true);
    // Only without server data, so Firestore is not part of the page's bundle.
    const { announcementsUtils } = await import('@/utils/announcementsUtils');
    const result = await announcementsUtils.getAnnouncementById(params.id);
    if (result.success && result.announcement.isPublished) {
      setAnnouncement(result.announcement);
    } else {
      setMissing(true);
    }
    setIsLoading(false);
  };

  const loadRecentAnnouncements = async () => {
    const { announcementsUtils } = await import('@/utils/announcementsUtils');
    const result = await announcementsUtils.getAnnouncements({ isPublished: true }, { limitCount: 5 });
    if (result.success) {
      setRecentAnnouncements(result.announcements.filter(item => item.id !== params.id));
    }
  };

  // Dates only: the minute an announcement was saved means nothing to a reader.
  const longDate = (value) =>
    value
      ? formatLocalizedDate(value, locale, {
          timeZone: 'Europe/Istanbul',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;
  const shortDate = (value) =>
    value
      ? formatLocalizedDate(
          value,
          locale,
          withYearIfNotCurrent(value, { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long' })
        )
      : null;

  const announcementTitle = getLocalizedField(announcement, 'title', locale);
  const announcementDescription = getLocalizedField(
    announcement,
    'description',
    locale
  );
  const announcementContent =
    getLocalizedField(announcement, 'content', locale) || announcementDescription;

  const shareNatively = async () => {
    try {
      await navigator.share({ title: announcementTitle, url: pageUrl });
    } catch {
      // Closing the share sheet rejects too; nothing to report.
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    setTimeout(() => setCopyStatus(null), 4000);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <p role="status" className="text-sm text-muted-foreground">{copy.loading}</p>
      </PageContainer>
    );
  }

  if (missing || !announcement) {
    return (
      <PageContainer>
        <EmptyState
          title={copy.notFound}
          action={
            <Link href="/announcements" className={shareLink}>
              {copy.backToList}
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const updated =
    announcement.updatedAt &&
    longDate(announcement.updatedAt) !== longDate(announcement.createdAt)
      ? longDate(announcement.updatedAt)
      : null;

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
          {/* A long title is cut with an ellipsis instead of pushing the trail onto two lines */}
          <li className="min-w-0">
            <span className="block max-w-[40vw] truncate text-ink sm:max-w-[60vw] lg:max-w-[40ch]">
              {announcementTitle}
            </span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
        <article className="min-w-0">
          <h1 className="break-words font-display text-4xl font-extrabold leading-tight">
            {announcementTitle}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {announcement.createdAt && (
              <time dateTime={announcement.createdAt} className="font-outlier">
                {longDate(announcement.createdAt)}
              </time>
            )}
            {announcement.authorName && (
              <span>
                {announcement.createdAt && ' · '}
                {copy.by}: {announcement.authorName}
              </span>
            )}
            {updated && (
              <span>
                {' · '}
                {copy.updated}: <span className="font-outlier">{updated}</span>
              </span>
            )}
          </p>
          {announcement.imageUrl && !imageError && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded bg-paper-2">
              <Image
                src={announcement.imageUrl}
                alt={announcementTitle}
                fill
                sizes="(min-width: 1024px) 720px, 100vw"
                className="object-cover"
                onError={() => setImageError(true)}
                priority
              />
            </div>
          )}
          {announcementContent ? (
            <div className="mt-6 max-w-measure break-words [overflow-wrap:anywhere]">
              <MarkdownRenderer content={plainTextToMarkdown(announcementContent)} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">{copy.noContent}</p>
          )}
        </article>

        <aside className="min-w-0">
          <Section title={copy.share} className="mt-0 md:mt-0">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {canNativeShare && (
                <Button type="button" variant="outline" onClick={shareNatively} className="mr-1">
                  <Share2 aria-hidden="true" />
                  {copy.shareNative}
                </Button>
              )}
              <button type="button" onClick={copyLink} className={`${shareLink} gap-1.5`}>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                {copy.copyLink}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${announcementTitle} ${pageUrl}`.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className={shareLink}
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={shareLink}
              >
                LinkedIn
              </a>
              <a
                href={`https://x.com/intent/post?text=${encodeURIComponent(announcementTitle)}&url=${encodeURIComponent(pageUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={shareLink}
              >
                X
              </a>
            </div>
            <p role="status" className="min-h-[1lh] text-sm text-ink-2">
              {copyStatus === 'copied' && copy.copied}
              {copyStatus === 'failed' && copy.copyFailed}
            </p>
          </Section>

          {recentAnnouncements.length > 0 && (
            <Section title={copy.recent} className="mt-8 md:mt-8">
              <ul>
                {recentAnnouncements.map(item => (
                  <li key={item.id}>
                    <Link
                      href={`/announcements/${item.docId ?? item.id}`}
                      className="group block border-b border-rule py-3 transition-colors duration-micro ease-out hover:bg-paper-2"
                    >
                      <p className="line-clamp-2 font-medium group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                        {getLocalizedField(item, 'title', locale)}
                      </p>
                      {item.createdAt && (
                        <p className="mt-1 font-outlier text-xs text-muted-foreground">
                          {shortDate(item.createdAt)}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
