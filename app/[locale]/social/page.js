import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import { getAllEvents } from "@/lib/content-data";
import SocialClient from "./SocialClient";

// Event names and dates for the board's headings; refreshed every 10 minutes like /events.
export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("social", locale);
}

export default async function SocialPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Posts store the event's `id`, so only what the headings show is sent to the client.
  const events = (await getAllEvents()).map((event) => ({
    id: event.id,
    name: event.name || "",
    nameEn: event.nameEn || "",
    startsAt: event.startsAt,
  }));

  return <SocialClient events={events} />;
}
