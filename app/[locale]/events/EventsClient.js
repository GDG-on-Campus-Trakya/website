"use client";

/* Hallmark · genre: editorial · macrostructure: Catalogue (next event, then a poster wall
 * banded by academic term) · design-system: design.md · designed-as-app
 * pre-emit critique: P4 H5 E4 S5 R5 V4
 */

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useRouter } from "@/i18n/navigation";
import EventSignup from "@/components/EventSignup";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { canOptimizeImage } from "@/lib/images";
import { logger } from "@/utils/logger";
import { formatLocalizedDate, getLocalizedField, withYearIfNotCurrent } from "@/utils/localeUtils";
import { getEventStart } from "@/utils/eventTime";
import { academicTerm, relativeDay, termLabel, termLabelParts } from "@/utils/eventCalendar";

const INSTAGRAM_URL = "https://www.instagram.com/gdgoncampustu/";

const COPY = {
  tr: {
    title: "Etkinlikler",
    subtitle:
      "Atölyeler, konuşmalar ve hackathon'lar. Kayıt bu sayfadan; QR biletin profiline düşer.",
    next: "Sıradaki etkinlik",
    later: "Daha sonra",
    noneTitle: "Sıradaki etkinlik henüz açıklanmadı.",
    noneBefore: "Açıklandığında burada olacak. Haberdar olmak için ",
    noneLink: "Instagram'dan takip et",
    noneAfter: ".",
    details: "Ayrıntılar",
    archive: "Geçmiş etkinlikler",
    count: (n) => `${n} etkinlik`,
    all: "Tümü",
    filterLabel: "Türe göre süz",
    noImage: "Afiş yok",
    qrEventMissing: "Bu QR koduna ait etkinlik artık listede yok.",
    invalidQr: "Bu QR kodu tanınmadı.",
    qrError: "QR kodu açılamadı. Sayfayı yenileyip yeniden dene.",
  },
  en: {
    title: "Events",
    subtitle:
      "Workshops, talks and hackathons. Register here; your QR ticket appears on your profile.",
    next: "Next event",
    later: "Later",
    noneTitle: "The next event has not been announced yet.",
    noneBefore: "It will be here once it is. To hear about it first, ",
    noneLink: "follow us on Instagram",
    noneAfter: ".",
    details: "Details",
    archive: "Past events",
    count: (n) => (n === 1 ? "1 event" : `${n} events`),
    all: "All",
    filterLabel: "Filter by type",
    noImage: "No poster",
    qrEventMissing: "The event for this QR code is no longer listed.",
    invalidQr: "This QR code was not recognised.",
    qrError: "The QR code could not be opened. Reload the page and try again.",
  },
};

const textLink =
  "inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2";

const eventHref = (event) => `/events/${event.docId ?? event.id}`;

// Old links (/events?event=<id>, a login return path) and event QR codes (/events?qrCode=)
// used to open a drawer here; the event now has one page, so they go straight to it.
function LegacyLinkRedirect({ events, onQrError }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || events.length === 0) return;
    const eventId = searchParams.get("event");
    const qrCodeId = searchParams.get("qrCode");
    if (!eventId && !qrCodeId) return;
    handled.current = true;

    if (eventId) {
      const event = events.find((entry) => (entry.docId ?? entry.id) === eventId || entry.id === eventId);
      router.replace(event ? eventHref(event) : "/events");
      return;
    }

    (async () => {
      try {
        const { db } = await import("@/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const snapshot = await getDoc(doc(db, "eventQrCodes", qrCodeId));
        if (!snapshot.exists()) {
          onQrError("invalidQr");
          router.replace("/events");
          return;
        }
        const event = events.find((entry) => entry.id === snapshot.data().eventId);
        if (event) router.replace(eventHref(event));
        else {
          onQrError("qrEventMissing");
          router.replace("/events");
        }
      } catch (error) {
        logger.error("Error handling QR code redirect:", error);
        onQrError("qrError");
      }
    })();
  }, [events, searchParams, router, onQrError]);

  return null;
}

// Posters are mostly A-series portrait; square and landscape ones sit on the same mat
// (object-contain), so the wall keeps one rhythm without cropping anyone's text.
function Poster({ event, name, sizes, priority = false, className = "" }) {
  return (
    <span
      className={`relative block aspect-[5/7] overflow-hidden rounded-sm bg-paper-2 ring-1 ring-inset ring-rule transition-shadow duration-micro ease-out group-hover:ring-ink ${className}`}
    >
      {event.imageUrl ? (
        <Image
          src={event.imageUrl}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!canOptimizeImage(event.imageUrl)}
          className="object-contain"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-lg font-bold text-muted-foreground">
          {name}
        </span>
      )}
    </span>
  );
}

function EventsPageContent({ initialEvents, serverNow }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [events, setEvents] = useState(initialEvents);
  const [isClient, setIsClient] = useState(false);
  const [category, setCategory] = useState("all");

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    // The server sends the events; read Firestore only when it could not.
    if (initialEvents.length > 0) return;
    (async () => {
      try {
        const { db } = await import("@/firebase");
        const { collection, getDocs } = await import("firebase/firestore");
        const snapshot = await getDocs(collection(db, "events"));
        setEvents(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data(), docId: entry.id })));
      } catch (error) {
        logger.error("Error fetching events:", error);
      }
    })();
  }, [initialEvents.length]);

  // Before hydration "now" is when the server rendered the page, so both renders agree.
  const now = isClient ? new Date() : new Date(serverNow);

  const name = (event) => getLocalizedField(event, "name", locale);
  const place = (event) => getLocalizedField(event, "location", locale);
  const categoryLabel = (event) =>
    getLocalizedField(event, "category", locale, { translateFallback: true, labelType: "eventCategory" });

  const dated = useMemo(
    () =>
      events
        .map((event) => ({ event, start: getEventStart(event) }))
        .filter((entry) => entry.start),
    [events]
  );

  const upcoming = dated
    .filter((entry) => entry.start >= now)
    .sort((a, b) => a.start - b.start);
  const past = dated
    .filter((entry) => entry.start < now)
    .sort((a, b) => b.start - a.start);

  // Filter chips: only the categories past events actually have, with real counts.
  const categories = useMemo(() => {
    const counts = new Map();
    past.forEach(({ event }) => {
      const key = event.category || "";
      if (!key) return;
      const entry = counts.get(key) || { key, label: categoryLabel(event), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [past.length, locale]);

  const shownPast = category === "all" ? past : past.filter(({ event }) => event.category === category);
  const terms = [];
  shownPast.forEach((entry) => {
    const term = academicTerm(entry.start);
    let group = terms.find((item) => item.key === term.key);
    if (!group) {
      group = { ...term, entries: [] };
      terms.push(group);
    }
    group.entries.push(entry);
  });
  terms.sort((a, b) => b.order - a.order);

  const shortDate = (date) =>
    formatLocalizedDate(
      date,
      locale,
      withYearIfNotCurrent(date, { timeZone: "Europe/Istanbul", day: "numeric", month: "short" })
    );

  const [nextEntry, ...laterEntries] = upcoming;

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.subtitle} />

      <Suspense fallback={null}>
        <LegacyLinkRedirect
          events={events}
          onQrError={(key) => toast.error(copy[key])}
        />
      </Suspense>

      {/* What is next comes first; with nothing scheduled it is one honest line, not a box. */}
      {nextEntry ? (
        <section aria-labelledby="events-next" className="border-t-2 border-ink pt-3">
          <h2 id="events-next" className="text-sm font-semibold text-ink">
            {copy.next}
          </h2>
          <NextEvent
            entry={nextEntry}
            name={name(nextEntry.event)}
            place={place(nextEntry.event)}
            category={categoryLabel(nextEntry.event)}
            relative={isClient ? relativeDay(nextEntry.start, locale) : null}
            locale={locale}
            copy={copy}
          />

          {laterEntries.length > 0 && (
            <div className="mt-10">
              <h3 className="border-b border-rule pb-2 text-sm font-semibold text-ink">{copy.later}</h3>
              <ul>
                {laterEntries.map(({ event, start }) => (
                  <li key={event.docId ?? event.id}>
                    <Link
                      href={eventHref(event)}
                      className="group grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-5 border-b border-rule py-4 transition-colors duration-micro ease-out hover:bg-paper-2 sm:grid-cols-[4rem_minmax(0,1fr)_auto]"
                    >
                      <DateBlock date={start} locale={locale} compact />
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-bold leading-tight group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                          {name(event)}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {[event.time, place(event)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <ArrowRight className="hidden h-4 w-4 text-muted-foreground group-hover:text-ink sm:block" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section
          aria-labelledby="events-next"
          className="flex flex-col gap-2 border-b border-rule pb-6 md:flex-row md:items-baseline md:justify-between md:gap-10"
        >
          <h2 id="events-next" className="font-display text-xl font-bold leading-tight md:text-2xl">
            {copy.noneTitle}
          </h2>
          <p className="max-w-md text-ink-2">
            {copy.noneBefore}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline underline-offset-4 decoration-1 hover:decoration-2"
            >
              {copy.noneLink}
            </a>
            {copy.noneAfter}
          </p>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="events-archive" className="mt-14 md:mt-20">
          <div className="flex flex-col gap-4 border-t-2 border-ink pt-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="events-archive" className="font-display text-2xl font-bold">
                {copy.archive}
              </h2>
              <p className="mt-1 font-outlier text-sm text-muted-foreground">{copy.count(past.length)}</p>
            </div>

            {categories.length > 1 && (
              <div role="group" aria-label={copy.filterLabel} className="flex flex-wrap gap-2">
                {[{ key: "all", label: copy.all, count: past.length }, ...categories].map((item) => {
                  const active = category === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(item.key)}
                      className={`inline-flex h-11 items-center gap-2 rounded-sm border px-3 text-sm font-medium md:h-9 transition-colors duration-micro ease-out ${
                        active
                          ? "border-ink bg-ink text-paper"
                          : "border-rule text-ink-2 hover:border-ink hover:text-ink"
                      }`}
                    >
                      {item.label}
                      <span className={`font-outlier text-xs tabular-nums ${active ? "text-paper/70" : "text-muted-foreground"}`}>
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* One continuous wall, newest first. Each term opens with a label tile in the same
              grid, so a term with one or two events does not leave a half-empty row. */}
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {terms.flatMap((term, termIndex) => {
              const label = termLabelParts(term, locale);
              return [
                <li key={term.key} className="min-w-0">
                  <h3
                    aria-label={`${termLabel(term, locale)}, ${copy.count(term.entries.length)}`}
                    className="flex aspect-[5/7] flex-col border-t-2 border-ink pt-3"
                  >
                    <span className="font-display text-3xl font-extrabold leading-none tracking-tight tabular-nums md:text-4xl">
                      {label.big}
                    </span>
                    <span className="mt-2 font-display text-lg font-bold leading-tight text-ink-2">
                      {label.small}
                    </span>
                    <span className="mt-auto font-outlier text-xs tabular-nums text-muted-foreground">
                      {copy.count(term.entries.length)}
                    </span>
                  </h3>
                </li>,
                ...term.entries.map(({ event, start }, index) => (
                  <li key={event.docId ?? event.id} className="min-w-0">
                    <Link href={eventHref(event)} className="group block rounded-sm focus-visible:outline-offset-4">
                      <Poster
                        event={event}
                        name={name(event)}
                        priority={termIndex === 0 && index < 4}
                        sizes="(min-width: 1280px) 210px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      />
                      <span className="mt-3 block font-outlier text-xs capitalize text-muted-foreground">
                        <time dateTime={start.toISOString()}>{shortDate(start)}</time>
                        {event.category && <span> · {categoryLabel(event)}</span>}
                      </span>
                      <span className="mt-1 block font-medium leading-snug text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                        {name(event)}
                      </span>
                      {place(event) && (
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">{place(event)}</span>
                      )}
                    </Link>
                  </li>
                )),
              ];
            })}
          </ul>
        </section>
      )}

      <ToastContainer position="top-right" autoClose={4000} newestOnTop closeOnClick pauseOnHover theme="light" />
    </PageContainer>
  );
}

/** The day number large, month and weekday small: how a date reads on a poster. */
function DateBlock({ date, locale, compact = false, time }) {
  const day = formatLocalizedDate(date, locale, { timeZone: "Europe/Istanbul", day: "numeric" });
  const month = formatLocalizedDate(
    date,
    locale,
    withYearIfNotCurrent(date, { timeZone: "Europe/Istanbul", month: compact ? "short" : "long" })
  );
  const weekday = formatLocalizedDate(date, locale, { timeZone: "Europe/Istanbul", weekday: "long" });

  if (compact) {
    return (
      <time dateTime={date.toISOString()} className="flex flex-col leading-none">
        <span className="font-display text-3xl font-extrabold tabular-nums">{day}</span>
        <span className="mt-1 font-outlier text-xs capitalize text-muted-foreground">{month}</span>
      </time>
    );
  }

  return (
    <time dateTime={date.toISOString()} className="flex items-end gap-4">
      <span className="font-display text-7xl font-extrabold leading-[0.8] tabular-nums tracking-tight md:text-8xl">
        {day}
      </span>
      <span className="pb-1 font-outlier text-sm capitalize leading-snug text-ink-2">
        {month}
        <br />
        {weekday}
        {time && ` · ${time}`}
      </span>
    </time>
  );
}

function NextEvent({ entry, name, place, category, relative, locale, copy }) {
  const { event, start } = entry;
  return (
    <article className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <div className="min-w-0 md:order-2">
        <p className="min-h-[1lh] font-outlier text-sm font-medium text-brand">{relative}</p>
        <div className="mt-2">
          <DateBlock date={start} locale={locale} time={event.time} />
        </div>
        <h3 className="mt-6 max-w-2xl font-display text-3xl font-extrabold leading-tight md:text-4xl">
          <Link href={eventHref(event)} className="rounded-sm hover:underline hover:decoration-brand hover:decoration-2 hover:underline-offset-4">
            {name}
          </Link>
        </h3>
        <p className="mt-2 text-ink-2">{[place, category].filter(Boolean).join(" · ")}</p>

        <div className="mt-6 max-w-sm">
          <EventSignup event={event} returnPath={eventHref(event)} />
        </div>
        <Link href={eventHref(event)} className={`${textLink} mt-2 text-sm`}>
          {copy.details}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <Link href={eventHref(event)} className="group block max-w-[16rem] rounded-sm md:order-1" tabIndex={-1} aria-hidden="true">
        <Poster event={event} name={name} priority sizes="256px" />
      </Link>
    </article>
  );
}

export default function EventsClient({ initialEvents = [], serverNow }) {
  return <EventsPageContent initialEvents={initialEvents} serverNow={serverNow} />;
}
