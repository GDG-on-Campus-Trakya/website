import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import { getAllEvents } from "@/lib/content-data";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import EventsClient from "./EventsClient";

// Events come from Firestore; refresh the static page every 10 minutes.
export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("events", locale);
}

export default async function EventsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const events = await getAllEvents();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: locale === "en" ? "Events" : "Etkinlikler", path: "/events" },
        ])}
      />
      <EventsClient initialEvents={events} serverNow={Date.now()} />
    </>
  );
}
