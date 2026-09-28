import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/home-data";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

// Events and announcements come from Firestore; refresh the static page every 10 minutes.
export const revalidate = 600;

const textLink =
  "inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2";

const rowLink =
  "group grid items-baseline gap-x-4 gap-y-1 border-b border-rule py-4 transition-colors duration-micro ease-out hover:bg-paper-2 focus-visible:outline-offset-[-2px]";

function RailHeader({ title, href, seeAll }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-3">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {href && (
        <Link href={href} className={textLink}>
          {seeAll}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default async function LandingPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });
  const { events, lastEvent, announcements } = await getHomeData();

  const [upcomingEvent, ...laterEvents] = events;
  // With nothing scheduled, the panel shows the most recent event instead
  const featuredEvent = upcomingEvent || lastEvent;
  const shortDate = (value) =>
    formatLocalizedDate(value, locale, {
      timeZone: "Europe/Istanbul",
      day: "numeric",
      month: "short"
    });
  const longDate = (value) =>
    formatLocalizedDate(value, locale, {
      timeZone: "Europe/Istanbul",
      weekday: "long",
      day: "numeric",
      month: "long"
    });

  const stats = [
    { value: "1000+", label: t("statMembers") },
    { value: "20+", label: t("statEvents") },
    { value: "10+", label: t("statPartners") },
    { value: "50+", label: t("statHours") }
  ];

  const tryItems = [
    { href: "/personality-test", title: t("tryPersonality"), text: t("tryPersonalityText") },
    { href: "/typing-test", title: t("tryTyping"), text: t("tryTypingText") },
    { href: "/game", title: t("tryGame"), text: t("tryGameText") }
  ];

  return (
    <div className="mx-auto w-full max-w-page px-gutter">
      {/* Statement and the next event */}
      <section className="grid gap-10 pb-12 pt-8 md:grid-cols-12 md:gap-8 md:pb-16 md:pt-12">
        <div className="md:col-span-7">
          <h1 className="font-display text-display-s font-extrabold">{t("title")}</h1>
          <p className="mt-6 max-w-measure text-md text-ink-2">{t("lede")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Button asChild size="lg">
              <Link href="/events">{t("ctaEvents")}</Link>
            </Button>
            <Link href="/about" className={textLink}>
              {t("ctaAbout")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="md:col-span-5 md:pt-2" aria-labelledby="next-event">
          <div className="border-t-2 border-ink pt-3">
            <h2 id="next-event" className="text-sm font-semibold text-ink">
              {upcomingEvent || !lastEvent ? t("nextEvent") : t("lastEvent")}
            </h2>
            {featuredEvent ? (
              <>
                <p className="mt-5 font-outlier text-sm capitalize text-muted-foreground">
                  <time dateTime={featuredEvent.start}>{longDate(featuredEvent.start)}</time>
                  {featuredEvent.time && <span> · {featuredEvent.time}</span>}
                </p>
                <p className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
                  {getLocalizedField(featuredEvent, "name", locale)}
                </p>
                {getLocalizedField(featuredEvent, "location", locale) && (
                  <p className="mt-2 text-ink-2">
                    {getLocalizedField(featuredEvent, "location", locale)}
                  </p>
                )}
                {!upcomingEvent && (
                  <p className="mt-4 text-sm text-muted-foreground">{t("noEvent")}</p>
                )}
                <Link href="/events" className={`${textLink} mt-2`}>
                  {upcomingEvent ? t("viewEvent") : t("ctaEvents")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-5 text-ink-2">{t("noEvent")}</p>
                <Link href="/events" className={`${textLink} mt-2`}>
                  {t("ctaEvents")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </aside>
      </section>

      {/* Community numbers: one quiet line, one colour */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-rule py-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse">
            <dt className="mt-2 text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="font-display text-4xl font-extrabold tabular-nums leading-none tracking-tight">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Rails: upcoming events and announcements */}
      <section className="grid gap-12 pb-4 pt-14 lg:grid-cols-12 lg:gap-10">
        {laterEvents.length > 0 && (
          <div className="lg:col-span-7">
            <RailHeader title={t("upcoming")} href="/events" seeAll={t("seeAll")} />
            <ul>
              {laterEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href="/events"
                    className={`${rowLink} grid-cols-[4.5rem_1fr] sm:grid-cols-[5rem_1fr_auto]`}
                  >
                    <time
                      dateTime={event.start}
                      className="font-outlier text-sm capitalize text-muted-foreground"
                    >
                      {shortDate(event.start)}
                    </time>
                    <span className="min-w-0">
                      <span className="block font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                        {getLocalizedField(event, "name", locale)}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {getLocalizedField(event, "location", locale)}
                      </span>
                    </span>
                    <span className="hidden font-outlier text-sm text-muted-foreground sm:block">
                      {event.time}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {announcements.length > 0 && (
          <div className={laterEvents.length > 0 ? "lg:col-span-5" : "lg:col-span-12"}>
            <RailHeader title={t("announcements")} href="/announcements" seeAll={t("seeAll")} />
            <ul>
              {announcements.map((announcement) => (
                <li key={announcement.id}>
                  <Link
                    href={`/announcements/${announcement.id}`}
                    className={`${rowLink} grid-cols-[4.5rem_1fr]`}
                  >
                    <time
                      dateTime={announcement.createdAt || undefined}
                      className="font-outlier text-sm capitalize text-muted-foreground"
                    >
                      {announcement.createdAt ? shortDate(announcement.createdAt) : ""}
                    </time>
                    <span className="font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                      {getLocalizedField(announcement, "title", locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Things to try, and the board photo */}
      <section className="grid items-end gap-10 pb-20 pt-10 lg:grid-cols-12 lg:gap-10 lg:pt-16">
        <div className="lg:col-span-5">
          <RailHeader title={t("try")} />
          <ul>
            {tryItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`${rowLink} grid-cols-1`}>
                  <span className="font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                    {item.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <figure className="lg:col-span-7">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-paper-2">
            <Image
              src="/yonetim-kurulu.webp"
              alt={t("teamAlt")}
              fill
              sizes="(min-width: 1152px) 640px, (min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-2 flex items-baseline justify-between gap-4 text-sm text-muted-foreground">
            <span>{t("teamCaption")}</span>
            <Link href="/about" className={textLink}>
              {t("teamLink")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </figcaption>
        </figure>
      </section>

      <section className="sr-only">
        <h2>{t("seoTitle")}</h2>
        <p>{t("seoP1")}</p>
        <p>{t("seoP2")}</p>
      </section>
    </div>
  );
}
