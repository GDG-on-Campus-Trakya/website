import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import {
  getAnnouncementById,
  getPublishedAnnouncements,
} from "@/lib/content-data";
import { buildMetadata, getSiteMeta } from "@/lib/seo";
import {
  breadcrumbJsonLd,
  organizationRef,
  plainText,
} from "@/lib/structured-data";
import { absoluteUrl } from "@/lib/seo";
import { getLocalizedField } from "@/utils/localeUtils";
import AnnouncementDetailClient from "./AnnouncementDetailClient";

export const revalidate = 600;

export async function generateStaticParams() {
  const announcements = await getPublishedAnnouncements();
  return announcements.map((announcement) => ({ id: announcement.docId }));
}

function describe(announcement, locale) {
  return plainText(
    getLocalizedField(announcement, "description", locale) ||
      getLocalizedField(announcement, "content", locale)
  );
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const announcement = await getAnnouncementById(id);

  if (!announcement) {
    return buildMetadata({
      locale,
      path: `/announcements/${id}`,
      title: locale === "en" ? "Announcements" : "Duyurular",
      description: locale === "en" ? "Announcements" : "Duyurular",
      noindex: true,
    });
  }

  const title = getLocalizedField(announcement, "title", locale);

  return buildMetadata({
    locale,
    path: `/announcements/${id}`,
    title,
    description:
      describe(announcement, locale) ||
      (locale === "en"
        ? `${title}: a GDG on Campus Trakya announcement.`
        : `${title}: GDG on Campus Trakya duyurusu.`),
    image: announcement.imageUrl || undefined,
    type: "article",
    publishedTime: announcement.createdAt || undefined,
    modifiedTime: announcement.updatedAt || announcement.createdAt || undefined,
  });
}

export default async function AnnouncementPage({ params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [announcement, all] = await Promise.all([
    getAnnouncementById(id),
    getPublishedAnnouncements(),
  ]);
  if (!announcement) notFound();

  const title = getLocalizedField(announcement, "title", locale);
  const site = getSiteMeta(locale);
  const recent = all
    .filter((item) => item.docId !== announcement.docId)
    .slice(0, 5);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title.slice(0, 110),
    description: describe(announcement, locale) || undefined,
    image: announcement.imageUrl ? [announcement.imageUrl] : undefined,
    datePublished: announcement.createdAt || undefined,
    dateModified: announcement.updatedAt || announcement.createdAt || undefined,
    inLanguage: locale,
    mainEntityOfPage: absoluteUrl(locale, `/announcements/${id}`),
    author: announcement.authorName
      ? { "@type": "Person", name: announcement.authorName }
      : { "@type": "Organization", name: site.siteName, ...organizationRef() },
    publisher: { "@type": "Organization", name: site.siteName, ...organizationRef() },
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          {
            name: locale === "en" ? "Announcements" : "Duyurular",
            path: "/announcements",
          },
          { name: title, path: `/announcements/${id}` },
        ])}
      />
      <AnnouncementDetailClient
        initialAnnouncement={announcement}
        initialRecent={recent}
      />
    </>
  );
}
