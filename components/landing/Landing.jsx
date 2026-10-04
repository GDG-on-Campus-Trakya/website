/* Hallmark · genre: playful-editorial · home page exception to design.md (see "Home page")
 * macrostructure: Marquee Hero · poster strip · colour stat tiles · next event · kinds · event-name band
 * pre-emit critique: P4 H4 E4 S5 R3 V5
 */
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { canOptimizeImage } from "@/lib/images";
import { formatLocalizedDate, getLocalizedField, withYearIfNotCurrent } from "@/utils/localeUtils";

const INSTAGRAM_URL = "https://www.instagram.com/gdgoncampustu/";

const COPY = {
  tr: {
    headline: "Trakya'da kod yazan öğrencilerin topluluğu",
    lede:
      "Atölyeler, konuşmalar ve hackathon'lar düzenliyoruz. Her bölümden öğrenci gelebilir; kayıt bu sitede, girişte QR biletini gösterirsin.",
    ctaEvents: "Etkinliklere bak",
    ctaFollow: "Instagram'da takip et",
    ctaAccount: "Hesap aç",
    posters: "Geçmiş etkinliklerin afişleri",
    stats: "Sitedeki kayıtlara göre topluluk",
    members: "kayıtlı üye",
    eventsHeld: "etkinlik",
    signups: "etkinlik kaydı",
    next: "Sıradaki etkinlik",
    last: "Son etkinlik",
    noNext: "Sıradaki etkinlik henüz açıklanmadı; açıklanınca burada ve Instagram'da olacak.",
    details: "Ayrıntılar ve kayıt",
    after: "Ardından",
    seeEvent: "Etkinliğe bak",
    what: "Ne yapıyoruz",
    count: (n) => `${n} etkinlik`,
    soFar: (n) => `Şimdiye kadar ${n} etkinlik`,
    allEvents: "Tüm etkinlikler",
    announcements: "Son duyurular",
    allAnnouncements: "Tüm duyurular",
    try: "Bu arada dene",
    tryItems: [
      { href: "/personality-test", title: "Kişilik testleri", text: "Sonucu paylaşabileceğin kısa testler." },
      { href: "/typing-test", title: "Yazma hızı testi", text: "Kod parçalarıyla hızını ölç." },
      { href: "/game", title: "Oyuna katıl", text: "Etkinlikte verilen kodla canlı quiz'e gir." },
    ],
    join: "Bir sonraki etkinlikte görüşelim.",
    joinBody: "Hesap aç, etkinliğe kayıt ol, QR biletinle gel. Duyurular için Instagram'ı takip et.",
  },
  en: {
    headline: "The community of students who code at Trakya",
    lede:
      "We run workshops, talks and hackathons. Students from any department can come; you register on this site and show your QR ticket at the door.",
    ctaEvents: "See events",
    ctaFollow: "Follow on Instagram",
    ctaAccount: "Create an account",
    posters: "Posters from past events",
    stats: "The community, from the records on this site",
    members: "members",
    eventsHeld: "events",
    signups: "event sign-ups",
    next: "Next event",
    last: "Last event",
    noNext: "The next event has not been announced yet; it will be here and on Instagram once it is.",
    details: "Details and registration",
    after: "After that",
    seeEvent: "See the event",
    what: "What we do",
    count: (n) => (n === 1 ? "1 event" : `${n} events`),
    soFar: (n) => (n === 1 ? "1 event so far" : `${n} events so far`),
    allEvents: "All events",
    announcements: "Latest announcements",
    allAnnouncements: "All announcements",
    try: "Try while you are here",
    tryItems: [
      { href: "/personality-test", title: "Personality tests", text: "Short tests with results you can share." },
      { href: "/typing-test", title: "Typing speed test", text: "Measure your speed on code snippets." },
      { href: "/game", title: "Join the game", text: "Enter a live quiz with the code given at the event." },
    ],
    join: "See you at the next event.",
    joinBody: "Create an account, register for an event, come with your QR ticket. Follow Instagram for announcements.",
  },
};

const MARKS = ["bg-mark-blue", "bg-mark-red", "bg-mark-yellow", "bg-mark-green"];
const BORDER_MARKS = ["border-mark-blue", "border-mark-red", "border-mark-yellow", "border-mark-green"];

const eventHref = (event) => `/events/${event.docId ?? event.id}`;
const eventName = (event, locale) => getLocalizedField(event, "name", locale);
const eventPlace = (event, locale) => getLocalizedField(event, "location", locale);

function shortDate(value, locale) {
  return formatLocalizedDate(
    value,
    locale,
    withYearIfNotCurrent(value, { timeZone: "Europe/Istanbul", day: "numeric", month: "short" })
  );
}

function dayParts(value, locale) {
  return {
    day: formatLocalizedDate(value, locale, { timeZone: "Europe/Istanbul", day: "numeric" }),
    month: formatLocalizedDate(value, locale, withYearIfNotCurrent(value, { timeZone: "Europe/Istanbul", month: "long" })),
    weekday: formatLocalizedDate(value, locale, { timeZone: "Europe/Istanbul", weekday: "long" }),
  };
}

/** An event poster on a 5:7 mat; square and landscape posters keep their text uncropped. */
function Poster({ event, sizes, className = "", priority = false }) {
  return (
    <span className={`relative block aspect-[5/7] overflow-hidden ${className}`}>
      <Image
        src={event.imageUrl}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!canOptimizeImage(event.imageUrl)}
        className="object-contain"
      />
    </span>
  );
}

/**
 * A row that drifts sideways and loops. The second copy only closes the loop, so it is kept out
 * of the accessibility tree and the tab order. Hover or focus pauses it; with reduced motion it
 * stands still and scrolls by hand. `spacing` holds the gap and the matching end padding.
 */
function Strip({ items, renderItem, label, reverse = false, secondsPerItem = 7, spacing = "gap-3 pr-3" }) {
  const style = { "--strip-duration": `${Math.max(items.length, 4) * secondsPerItem}s` };
  return (
    <div role="region" aria-label={label} className="landing-strip overflow-x-auto motion-safe:overflow-hidden">
      <div style={style} className={`landing-strip-track flex w-max ${reverse ? "landing-strip-reverse" : ""}`}>
        <ul className={`flex shrink-0 items-center ${spacing}`}>
          {items.map((item, index) => (
            <li key={index} className="shrink-0">
              {renderItem(item, index, false)}
            </li>
          ))}
        </ul>
        <div aria-hidden="true" className={`flex shrink-0 items-center motion-reduce:hidden ${spacing}`}>
          {items.map((item, index) => (
            <div key={index} className="shrink-0">
              {renderItem(item, index, true)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, href, linkLabel, className = "" }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-2 ${className}`}>
      <h2 className="font-display text-3xl font-extrabold md:text-4xl">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-sm font-semibold text-brand hover:underline hover:underline-offset-4">
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default function Landing({ data, locale, seo }) {
  const copy = COPY[locale] || COPY.tr;
  const { upcoming, past, posters, kinds, announcements, stats } = data;
  const next = upcoming[0];
  const featured = next || past[0];
  const parts = featured ? dayParts(featured.startsAt, locale) : null;
  const format = new Intl.NumberFormat(locale === "en" ? "en-GB" : "tr-TR");
  const tiles = [
    { value: stats?.members, label: copy.members, className: "bg-brand text-brand-ink" },
    { value: stats?.events, label: copy.eventsHeld, className: "bg-mark-yellow text-ink" },
    { value: stats?.registrations, label: copy.signups, className: "bg-ink text-paper" },
  ].filter((tile) => Number.isFinite(tile.value) && tile.value > 0);

  return (
    <div>
      <section className="mx-auto w-full max-w-page px-gutter pt-10 md:pt-16">
        <div className="flex gap-1.5" aria-hidden="true">
          {MARKS.map((mark) => (
            <span key={mark} className={`h-2 w-14 rounded-sm ${mark}`} />
          ))}
        </div>
        <h1 className="mt-6 max-w-5xl font-display text-[clamp(2.75rem,7vw,6.5rem)] font-extrabold leading-[0.95] tracking-tight">
          {copy.headline}
        </h1>
        <div className="mt-8 grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <p className="max-w-2xl text-lg text-ink-2">{copy.lede}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/events">{copy.ctaEvents}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                {copy.ctaFollow}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Posters, not people: the club's own material carries the colour here */}
      {posters.length > 0 && (
        <div className="mt-12">
          <Strip
            label={copy.posters}
            items={posters}
            renderItem={(event, index, copyOfLoop) => (
              <Link
                href={eventHref(event)}
                tabIndex={copyOfLoop ? -1 : undefined}
                aria-label={copyOfLoop ? undefined : eventName(event, locale)}
                className="block w-40 rounded md:w-52"
              >
                <Poster event={event} priority={!copyOfLoop && index < 4} sizes="208px" className="rounded bg-paper-2" />
              </Link>
            )}
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-page px-gutter">
        {tiles.length > 0 && (
          <dl aria-label={copy.stats} className="mt-12 grid grid-cols-3 gap-2 sm:gap-3">
            {tiles.map((tile) => (
              <div key={tile.label} className={`flex min-w-0 flex-col-reverse justify-end rounded-lg p-3 sm:p-6 ${tile.className}`}>
                <dt className="mt-2 text-xs font-medium leading-snug sm:text-sm">{tile.label}</dt>
                <dd className="font-display text-3xl font-extrabold leading-none tabular-nums sm:text-5xl md:text-6xl">{format.format(tile.value)}</dd>
              </div>
            ))}
          </dl>
        )}

        {featured && (
          <section aria-labelledby="home-featured" className="mt-16 grid gap-8 rounded-lg bg-paper-2 p-6 md:grid-cols-[14rem_minmax(0,1fr)] md:p-10">
            {featured.imageUrl && (
              <Link href={eventHref(featured)} tabIndex={-1} aria-hidden="true" className="hidden md:block">
                <Poster event={featured} sizes="224px" className="rounded bg-paper" />
              </Link>
            )}
            <div className="flex min-w-0 flex-col">
              <h2 id="home-featured" className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-ink">
                <span className={`h-2.5 w-2.5 rounded-full ${next ? "bg-mark-green" : "bg-mark-red"}`} aria-hidden="true" />
                {next ? copy.next : copy.last}
              </h2>
              <p className="mt-4 flex items-end gap-4">
                <span className="font-display text-8xl font-extrabold leading-[0.8] text-brand">{parts.day}</span>
                <span className="pb-1 font-outlier text-sm capitalize text-ink-2">
                  {parts.month}
                  <br />
                  {parts.weekday}
                  {featured.time && ` · ${featured.time}`}
                </span>
              </p>
              <p className="mt-6 font-display text-3xl font-extrabold leading-tight md:text-4xl">{eventName(featured, locale)}</p>
              {eventPlace(featured, locale) && <p className="mt-1 text-ink-2">{eventPlace(featured, locale)}</p>}
              {!next && <p className="mt-3 max-w-measure text-sm text-muted-foreground">{copy.noNext}</p>}
              <div className="mt-6">
                <Button asChild size="lg">
                  <Link href={eventHref(featured)}>{next ? copy.details : copy.seeEvent}</Link>
                </Button>
              </div>
              {/* When several are announced at once, the rest are one tap away too */}
              {upcoming.length > 1 && (
                <div className="mt-8 border-t border-rule pt-4">
                  <h3 className="text-sm font-semibold text-ink">{copy.after}</h3>
                  <ul className="mt-1">
                    {upcoming.slice(1, 4).map((event) => (
                      <li key={event.docId}>
                        <Link
                          href={eventHref(event)}
                          className="group grid min-h-11 grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-4 py-2.5"
                        >
                          <time dateTime={event.startsAt} className="font-outlier text-sm capitalize text-muted-foreground">
                            {shortDate(event.startsAt, locale)}
                          </time>
                          <span className="font-medium group-hover:underline">{eventName(event, locale)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {kinds.length > 0 && (
          <section className="mt-16">
            <SectionHead title={copy.what} />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {kinds.map((kind, index) => (
                <li key={kind.key} className={`rounded-lg border-t-8 bg-paper-2 p-5 ${BORDER_MARKS[index % 4]}`}>
                  <p className="font-display text-2xl font-extrabold">{kind.label}</p>
                  <p className="mt-1 font-outlier text-sm text-muted-foreground">{copy.count(kind.count)}</p>
                  <p className="mt-3 text-sm text-ink-2">{kind.examples.join(" · ")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Every event so far by name, in type rather than photos */}
      {past.length > 0 && (
        <section aria-labelledby="home-so-far" className="mt-16 bg-ink py-10 text-paper md:py-14">
          <div className="mx-auto flex w-full max-w-page flex-wrap items-end justify-between gap-x-6 gap-y-2 px-gutter">
            <h2 id="home-so-far" className="font-display text-xl font-bold">
              {copy.soFar(past.length)}
            </h2>
            <Link href="/events" className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-sm font-semibold underline decoration-1 underline-offset-4 hover:decoration-2">
              {copy.allEvents}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6">
            <Strip
              reverse
              label={copy.soFar(past.length)}
              items={past}
              secondsPerItem={14}
              spacing="gap-8 pr-8 md:gap-12 md:pr-12"
              renderItem={(event, index, copyOfLoop) => (
                <Link
                  href={eventHref(event)}
                  tabIndex={copyOfLoop ? -1 : undefined}
                  className="flex items-center gap-8 whitespace-nowrap rounded-sm font-display text-4xl font-extrabold tracking-tight hover:underline hover:decoration-4 hover:underline-offset-8 md:gap-12 md:text-6xl"
                >
                  <span className={`h-4 w-4 shrink-0 rounded-full md:h-5 md:w-5 ${MARKS[index % 4]}`} aria-hidden="true" />
                  {eventName(event, locale)}
                </Link>
              )}
            />
          </div>
        </section>
      )}

      <div className="mx-auto w-full max-w-page px-gutter">
        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          {announcements.length > 0 && (
            <div>
              <SectionHead title={copy.announcements} href="/announcements" linkLabel={copy.allAnnouncements} />
              <ul className="mt-4 space-y-3">
                {announcements.map((item) => (
                  <li key={item.id}>
                    <Link href={`/announcements/${item.id}`} className="group block rounded-lg bg-paper-2 p-4 hover:bg-paper-3">
                      {item.createdAt && (
                        <time dateTime={item.createdAt} className="block font-outlier text-xs capitalize text-muted-foreground">
                          {shortDate(item.createdAt, locale)}
                        </time>
                      )}
                      <span className="mt-1 block font-semibold group-hover:underline">{getLocalizedField(item, "title", locale)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={announcements.length > 0 ? "" : "lg:col-span-2"}>
            <SectionHead title={copy.try} />
            <ul className="mt-4 space-y-3">
              {copy.tryItems.map((item, index) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-4 rounded-lg bg-paper-2 p-4 hover:bg-paper-3">
                    <span className={`h-10 w-1.5 shrink-0 rounded-sm ${MARKS[(index + 1) % 4]}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold group-hover:underline">{item.title}</span>
                      <span className="block text-sm text-muted-foreground">{item.text}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="mt-20 bg-brand text-brand-ink">
        <div className="mx-auto w-full max-w-page px-gutter py-14 md:py-20">
          <p className="max-w-3xl font-display text-4xl font-extrabold leading-tight md:text-6xl">{copy.join}</p>
          <p className="mt-4 max-w-measure text-lg">{copy.joinBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">{copy.ctaAccount}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-brand-ink bg-transparent text-brand-ink hover:bg-brand-hover hover:text-brand-ink">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                {copy.ctaFollow}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Plain description of the community for readers and search engines alike */}
      <section className="mx-auto w-full max-w-page px-gutter pb-16 pt-8">
        <h2 className="text-sm font-semibold text-ink">{seo.title}</h2>
        <div className="mt-2 grid max-w-5xl gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <p>{seo.p1}</p>
          <p>{seo.p2}</p>
        </div>
      </section>
    </div>
  );
}
