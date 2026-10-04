/* Hallmark · genre: editorial · macrostructure: poster + ticket (essentials first on phones)
 * design-system: design.md · designed-as-app · pre-emit critique: P4 H5 E4 S5 R5 V4
 */
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, CalendarPlus, Download, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page";
import JsonLd from "@/components/JsonLd";
import EventSignup from "@/components/EventSignup";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ShareLinks from "@/components/ShareLinks";
import {
  getAllEvents,
  getEventById,
  getEventPhotoCount,
  getSponsors,
} from "@/lib/content-data";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, eventJsonLd, plainText } from "@/lib/structured-data";
import { getEventStart } from "@/utils/eventTime";
import { relativeDay } from "@/utils/eventCalendar";
import { formatLocalizedDate, getLocalizedField, withYearIfNotCurrent } from "@/utils/localeUtils";

export const revalidate = 600;

const COPY = {
  tr: {
    back: "Tüm etkinlikler",
    events: "Etkinlikler",
    category: "Tür",
    location: "Yer",
    time: "Saat",
    map: "Haritada aç",
    about: "Etkinlik hakkında",
    sponsors: "Destekleyenler",
    documents: "Etkinlik belgeleri",
    addToCalendar: "Takvime ekle",
    googleCalendar: "Google Takvim",
    icsFile: "Apple, Outlook (.ics)",
    upcoming: "Yaklaşan etkinlik",
    ended: (date) => `Bu etkinlik ${date} tarihinde yapıldı.`,
    photos: (n) => `Etkinlikten ${n} fotoğraf`,
    previous: "Önceki etkinlik",
    next: "Sonraki etkinlik",
    fallbackDescription: (name, date) =>
      `${name}, ${date} tarihinde GDG on Campus Trakya Üniversitesi tarafından düzenleniyor.`,
  },
  en: {
    back: "All events",
    events: "Events",
    category: "Type",
    location: "Place",
    time: "Time",
    map: "Open in maps",
    about: "About the event",
    sponsors: "Supported by",
    documents: "Event documents",
    addToCalendar: "Add to calendar",
    googleCalendar: "Google Calendar",
    icsFile: "Apple, Outlook (.ics)",
    upcoming: "Upcoming event",
    ended: (date) => `This event took place on ${date}.`,
    photos: (n) => (n === 1 ? "1 photo from the event" : `${n} photos from the event`),
    previous: "Previous event",
    next: "Next event",
    fallbackDescription: (name, date) =>
      `${name} takes place on ${date}, organised by GDG on Campus Trakya University.`,
  },
};

const DATE_FORMAT = {
  timeZone: "Europe/Istanbul",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

const textLink =
  "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2";

export async function generateStaticParams() {
  const events = await getAllEvents();
  return events.map((event) => ({ id: event.docId }));
}

function describe(event, locale) {
  const copy = COPY[locale] || COPY.tr;
  const name = getLocalizedField(event, "name", locale);
  const description = plainText(getLocalizedField(event, "description", locale));

  return (
    description ||
    copy.fallbackDescription(name, formatLocalizedDate(event.startsAt, locale, DATE_FORMAT))
  );
}

// Google Calendar "add event" link; the event stores only a start, so the entry is two hours.
function googleCalendarUrl({ name, start, location, url }) {
  const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: name,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: url,
    ...(location && { location: `${location}, Edirne` }),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const event = await getEventById(id);
  const copy = COPY[locale] || COPY.tr;

  if (!event) {
    return buildMetadata({
      locale,
      path: `/events/${id}`,
      title: copy.events,
      description: copy.events,
      noindex: true,
    });
  }

  return buildMetadata({
    locale,
    path: `/events/${id}`,
    title: getLocalizedField(event, "name", locale),
    description: describe(event, locale),
    image: event.imageUrl || undefined,
  });
}

export default async function EventPage({ params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [event, allSponsors, allEvents] = await Promise.all([
    getEventById(id),
    getSponsors(),
    getAllEvents(),
  ]);
  if (!event) notFound();

  const copy = COPY[locale] || COPY.tr;
  const name = getLocalizedField(event, "name", locale);
  const description = getLocalizedField(event, "description", locale);
  const location = getLocalizedField(event, "location", locale);
  const category = getLocalizedField(event, "category", locale, {
    translateFallback: true,
    labelType: "eventCategory",
  });
  const start = getEventStart(event);
  const now = new Date();
  const hasEnded = start < now;
  const photoCount = hasEnded ? await getEventPhotoCount(event.id) : 0;
  const sponsors = allSponsors.filter((sponsor) => (event.sponsors || []).includes(sponsor.id));

  // Neighbours in time, for walking through the programme without going back to the list.
  const ordered = allEvents.filter((entry) => entry.startsAt);
  const index = ordered.findIndex((entry) => entry.docId === event.docId);
  const previous = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;

  const day = formatLocalizedDate(start, locale, { timeZone: "Europe/Istanbul", day: "numeric" });
  const month = formatLocalizedDate(
    start,
    locale,
    withYearIfNotCurrent(start, { timeZone: "Europe/Istanbul", month: "long" })
  );
  const weekday = formatLocalizedDate(start, locale, { timeZone: "Europe/Istanbul", weekday: "long" });
  const fullDate = formatLocalizedDate(start, locale, {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const status = hasEnded ? null : relativeDay(start, locale, now) || copy.upcoming;
  const mapUrl =
    location &&
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location}, Edirne`)}`;

  const neighbourDate = (entry) =>
    formatLocalizedDate(
      entry.startsAt,
      locale,
      withYearIfNotCurrent(entry.startsAt, { timeZone: "Europe/Istanbul", day: "numeric", month: "short" })
    );

  const factRow = "grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 border-b border-rule py-3";

  return (
    <PageContainer>
      <JsonLd
        data={eventJsonLd(event, locale, {
          description: describe(event, locale),
          image: event.imageUrl,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: copy.events, path: "/events" },
          { name, path: `/events/${id}` },
        ])}
      />

      <Link href="/events" className={textLink}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {copy.back}
      </Link>

      {/* Phone: essentials, poster, then the description. Wide screen: the poster holds the left
          column while both text blocks stack on the right. */}
      <article
        className={`mt-4 grid gap-x-12 gap-y-10 ${
          event.imageUrl ? "lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]" : ""
        }`}
      >
        {event.imageUrl && (
          <figure className="order-2 lg:sticky lg:top-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
            <a
              href={event.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-sm rounded-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.imageUrl}
                alt={name}
                className="h-auto w-full rounded-sm bg-paper-2 ring-1 ring-rule"
                decoding="async"
              />
            </a>
          </figure>
        )}

        <div className={`order-1 min-w-0 ${event.imageUrl ? "lg:col-start-2 lg:row-start-1" : ""}`}>
          <header className="border-t-2 border-ink pt-4">
            {status && <p className="font-outlier text-sm font-medium text-brand">{status}</p>}
            <time dateTime={event.startsAt} className="mt-2 flex items-end gap-4">
              <span className="font-display text-7xl font-extrabold leading-[0.8] tabular-nums tracking-tight md:text-8xl">
                {day}
              </span>
              <span className="pb-1 font-outlier text-sm capitalize leading-snug text-ink-2">
                {month}
                <br />
                {weekday}
              </span>
            </time>
            <h1 className="mt-6 max-w-3xl break-words font-display text-4xl font-extrabold leading-tight md:text-5xl">
              {name}
            </h1>
          </header>

          <dl className="mt-8 max-w-2xl border-t border-rule">
            {event.time && (
              <div className={factRow}>
                <dt className="text-sm text-muted-foreground">{copy.time}</dt>
                <dd className="font-outlier tabular-nums text-ink">{event.time}</dd>
              </div>
            )}
            {location && (
              <div className={factRow}>
                <dt className="text-sm text-muted-foreground">{copy.location}</dt>
                <dd className="min-w-0 text-ink">
                  <span className="block">{location}</span>
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={textLink}>
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {copy.map}
                  </a>
                </dd>
              </div>
            )}
            {category && (
              <div className={factRow}>
                <dt className="text-sm text-muted-foreground">{copy.category}</dt>
                <dd className="text-ink">{category}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8 max-w-2xl">
            {hasEnded ? (
              <div className="border-l-2 border-rule pl-4">
                <p className="text-ink-2">{copy.ended(fullDate)}</p>
                {photoCount > 0 && (
                  <Link href={`/social#event-${event.id}`} className={textLink}>
                    {copy.photos(photoCount)}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Register right here; this page is the link people share. */}
                <div className="max-w-sm">
                  <EventSignup event={{ id: event.id }} returnPath={`/events/${id}`} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-5">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    {copy.addToCalendar}:
                  </span>
                  <a
                    href={googleCalendarUrl({
                      name,
                      start,
                      location,
                      url: absoluteUrl(locale, `/events/${id}`),
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={textLink}
                  >
                    {copy.googleCalendar}
                  </a>
                  <a href={`/api/events/${id}/ics?locale=${locale}`} className={textLink}>
                    {copy.icsFile}
                  </a>
                </div>
              </>
            )}

            <div className="mt-6 border-t border-rule pt-2">
              <ShareLinks title={name} />
            </div>
          </div>
        </div>

        <div className={`order-3 min-w-0 ${event.imageUrl ? "lg:col-start-2 lg:row-start-2" : ""}`}>
          {description && (
            <section aria-labelledby="event-about" className="max-w-measure">
              <h2 id="event-about" className="border-t-2 border-ink pt-3 font-display text-xl font-bold">
                {copy.about}
              </h2>
              <div className="mt-4">
                <MarkdownRenderer content={description} />
              </div>
            </section>
          )}

          {event.file_url && (
            <Button asChild variant="outline" className="mt-6">
              <a href={event.file_url} target="_blank" rel="noopener noreferrer">
                <Download aria-hidden="true" />
                {copy.documents}
              </a>
            </Button>
          )}

          {sponsors.length > 0 && (
            <section aria-labelledby="event-sponsors" className="mt-12 max-w-2xl">
              <h2 id="event-sponsors" className="border-t border-rule pt-3 text-sm font-semibold text-ink">
                {copy.sponsors}
              </h2>
              <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
                {sponsors.map((sponsor) => (
                  <li key={sponsor.id} className="flex items-center gap-3">
                    {sponsor.img_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sponsor.img_url}
                        alt=""
                        className="h-10 w-10 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className="text-ink-2">{getLocalizedField(sponsor, "name", locale)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>

      {(previous || next) && (
        <nav aria-label={copy.events} className="mt-16 grid border-y border-rule sm:grid-cols-2">
          {previous && (
            <Link
              href={`/events/${previous.docId}`}
              className="group block py-5 transition-colors duration-micro ease-out hover:bg-paper-2 sm:pr-6"
            >
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {copy.previous}
              </span>
              <span className="mt-1 block font-display text-lg font-bold leading-tight group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                {getLocalizedField(previous, "name", locale)}
              </span>
              <span className="block font-outlier text-xs capitalize text-muted-foreground">
                {neighbourDate(previous)}
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={`/events/${next.docId}`}
              className={`group block py-5 transition-colors duration-micro ease-out hover:bg-paper-2 sm:col-start-2 sm:pl-6 sm:text-right ${previous ? "border-t border-rule sm:border-l sm:border-t-0" : ""}`}
            >
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                {copy.next}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="mt-1 block font-display text-lg font-bold leading-tight group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                {getLocalizedField(next, "name", locale)}
              </span>
              <span className="block font-outlier text-xs capitalize text-muted-foreground">
                {neighbourDate(next)}
              </span>
            </Link>
          )}
        </nav>
      )}
    </PageContainer>
  );
}
