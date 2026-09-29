import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import { getPublishedAnnouncements } from "@/lib/content-data";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import AnnouncementsClient from "./AnnouncementsClient";

// Announcements come from Firestore; refresh the static page every 10 minutes.
export const revalidate = 600;

const PAGE_SIZE = 12;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("announcements", locale);
}

export default async function AnnouncementsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const announcements = await getPublishedAnnouncements();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          {
            name: locale === "en" ? "Announcements" : "Duyurular",
            path: "/announcements",
          },
        ])}
      />
      <AnnouncementsClient
        initialAnnouncements={announcements.slice(0, PAGE_SIZE)}
        initialHasMore={announcements.length > PAGE_SIZE}
      />
    </>
  );
}
