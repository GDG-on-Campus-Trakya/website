import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page";
import JsonLd from "@/components/JsonLd";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { getAllEvents, getEventById, getSponsors } from "@/lib/content-data";
import { buildMetadata } from "@/lib/seo";
import {
  breadcrumbJsonLd,
  eventJsonLd,
  plainText,
} from "@/lib/structured-data";
import { getEventStart } from "@/utils/eventTime";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

export const revalidate = 600;

const COPY = {
  tr: {
    back: "Tüm etkinlikler",
    events: "Etkinlikler",
    category: "Kategori",
    location: "Yer",
    sponsors: "Sponsorlar",
    documents: "Etkinlik belgeleri",
    register: "Kayıt ol",
    ended: "Bu etkinlik sona erdi.",
    upcoming: "Yaklaşan",
    past: "Geçmiş",
    fallbackDescription: (name, date) =>
      `${name}, ${date} tarihinde GDG on Campus Trakya Üniversitesi tarafından düzenleniyor.`,
  },
  en: {
    back: "All events",
    events: "Events",
    category: "Category",
    location: "Location",
    sponsors: "Sponsors",
    documents: "Event documents",
    register: "Register",
    ended: "This event has ended.",
    upcoming: "Upcoming",
    past: "Past",
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
    copy.fallbackDescription(
      name,
      formatLocalizedDate(event.startsAt, locale, DATE_FORMAT)
    )
  );
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

  const [event, allSponsors] = await Promise.all([
    getEventById(id),
    getSponsors(),
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
  const hasEnded = getEventStart(event) < new Date();
  const sponsors = allSponsors.filter((sponsor) =>
    (event.sponsors || []).includes(sponsor.id)
  );

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

      <Link
        href="/events"
        className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {copy.back}
      </Link>

      <article className="mt-4">
        <header className="mb-8 border-b border-rule pb-6 md:mb-10 md:pb-8">
          <p className="font-outlier text-sm capitalize text-muted-foreground">
            <time dateTime={event.startsAt}>
              {formatLocalizedDate(event.startsAt, locale, DATE_FORMAT)}
            </time>
            {event.time && <span> · {event.time}</span>}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold md:text-5xl">
            {name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {category && <Badge>{category}</Badge>}
            <Badge variant={hasEnded ? "neutral" : "success"}>
              {hasEnded ? copy.past : copy.upcoming}
            </Badge>
          </div>
        </header>

        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-8">
            {event.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.imageUrl}
                alt={name}
                className="h-auto w-full max-w-3xl rounded-lg bg-paper-2"
                decoding="async"
              />
            )}
            {description && <MarkdownRenderer content={description} />}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <dl className="space-y-3 border-t-2 border-ink pt-3 text-base">
              {location && (
                <div>
                  <dt className="text-sm font-semibold text-ink">{copy.location}</dt>
                  <dd className="text-ink-2">{location}</dd>
                </div>
              )}
              {category && (
                <div>
                  <dt className="text-sm font-semibold text-ink">{copy.category}</dt>
                  <dd className="text-ink-2">{category}</dd>
                </div>
              )}
            </dl>

            {hasEnded ? (
              <p className="border border-rule px-4 py-3 text-sm font-medium text-ink-2">
                {copy.ended}
              </p>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href={`/events?event=${id}`}>{copy.register}</Link>
              </Button>
            )}

            {event.file_url && (
              <Button asChild variant="outline" className="w-full">
                <a href={event.file_url} target="_blank" rel="noopener noreferrer">
                  <Download aria-hidden="true" />
                  {copy.documents}
                </a>
              </Button>
            )}

            {sponsors.length > 0 && (
              <div>
                <h2 className="border-t-2 border-ink pt-3 font-display text-lg font-bold">
                  {copy.sponsors}
                </h2>
                <ul className="mt-3 flex flex-wrap gap-4">
                  {sponsors.map((sponsor) => (
                    <li key={sponsor.id} className="flex items-center gap-2">
                      {sponsor.img_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sponsor.img_url}
                          alt={getLocalizedField(sponsor, "name", locale)}
                          className="h-10 w-10 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <span>{getLocalizedField(sponsor, "name", locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </article>
    </PageContainer>
  );
}
