import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/home-data";
import { pageMetadata } from "@/lib/page-meta";
import {
  formatLocalizedDate,
  getLocaleCode,
  getLocalizedField,
  withYearIfNotCurrent
} from "@/utils/localeUtils";

// Events and announcements come from Firestore; refresh the static page every 10 minutes.
export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("home", locale);
}

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
  const { events, lastEvent, announcements, stats: counts } = await getHomeData();

  const [upcomingEvent, ...laterEvents] = events;
  // With nothing scheduled, the panel shows the most recent event instead
  const featuredEvent = upcomingEvent || lastEvent;
  const shortDate = (value) =>
    formatLocalizedDate(
      value,
      locale,
      withYearIfNotCurrent(value, { timeZone: "Europe/Istanbul", day: "numeric", month: "short" })
    );
  const longDate = (value) =>
    formatLocalizedDate(
      value,
      locale,
      withYearIfNotCurrent(value, {
        timeZone: "Europe/Istanbul",
        weekday: "long",
        day: "numeric",
        month: "long"
      })
    );
  // A date from another year is longer ("8 Eki 2025"); widen a list's date column only then.
  const showsYear = (dates) =>
    dates.some((value) => value && "year" in withYearIfNotCurrent(value, { timeZone: "Europe/Istanbul" }));

  const numberFormat = new Intl.NumberFormat(getLocaleCode(locale));
  const stats = [
    { value: counts?.members, label: t("statMembers") },
    { value: counts?.events, label: t("statEvents") },
    { value: counts?.registrations, label: t("statRegistrations") },
    { value: counts?.partners, label: t("statPartners") }
  ].filter((stat) => Number.isFinite(stat.value) && stat.value > 0);

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

      {/* Community numbers counted from Firestore: one quiet line, one colour */}
      {stats.length > 0 && (
        <dl
          aria-label={t("statsLabel")}
          className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-rule py-6 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="font-display text-4xl font-extrabold tabular-nums leading-none tracking-tight">
                {numberFormat.format(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      )}

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
                    className={`${rowLink} ${
                      showsYear(laterEvents.map((item) => item.start))
                        ? "grid-cols-[6.5rem_1fr] sm:grid-cols-[6.5rem_1fr_auto]"
                        : "grid-cols-[4.5rem_1fr] sm:grid-cols-[5rem_1fr_auto]"
                    }`}
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
                    className={`${rowLink} ${
                      showsYear(announcements.map((item) => item.createdAt))
                        ? "grid-cols-[6.5rem_1fr]"
                        : "grid-cols-[4.5rem_1fr]"
                    }`}
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

      {/* Things to try */}
      <section className="pb-14 pt-10 lg:pt-16">
        <RailHeader title={t("try")} />
        <ul>
          {tryItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${rowLink} grid-cols-1 sm:grid-cols-[minmax(0,16rem)_1fr_auto]`}
              >
                <span className="font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                  {item.title}
                </span>
                <span className="text-sm text-muted-foreground">{item.text}</span>
                <ArrowRight
                  className="hidden h-4 w-4 text-muted-foreground group-hover:text-ink sm:block"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Plain description of the community for readers and search engines alike */}
      <section className="border-t-2 border-ink pb-20 pt-3">
        <h2 className="font-display text-xl font-bold">{t("seoTitle")}</h2>
        <div className="mt-4 max-w-measure space-y-4 text-ink-2">
          <p>{t("seoP1")}</p>
          <p>{t("seoP2")}</p>
        </div>
      </section>
    </div>
  );
}
