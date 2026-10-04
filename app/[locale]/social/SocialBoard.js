"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";
import AnnouncementCard from "@/components/AnnouncementCard";
import ErrorBoundary from "@/components/ErrorBoundary";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { EmptyState, PageContainer, PageHeader, Skeleton } from "@/components/ui/page";
import { getEventStart } from "@/utils/eventTime";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

const POSTING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const TILE_SIZES = "(min-width: 1152px) 288px, (min-width: 1024px) 25vw, (min-width: 640px) 31vw, 48vw";

const tileGrid = "grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3";

export const BOARD_COPY = {
  tr: {
    title: "Etkinlik fotoğrafları",
    lede:
      "Etkinliklerimizden fotoğraflar, etkinliğe göre. Bir etkinlik başladıktan sonraki üç gün içinde paylaştığın fotoğraf o etkinliğin çekilişine katılır.",
    share: "Fotoğraf paylaş",
    openNow: "Paylaşıma açık",
    until: (date) => `son gün ${date}`,
    nothingOpen: "Şu an paylaşıma açık etkinlik yok.",
    photos: (count) => `${count} fotoğraf`,
    otherPhotos: "Diğer fotoğraflar",
    loadMore: "Daha fazla fotoğraf",
    earlierRaffles: "Önceki çekilişler",
    emptyTitle: "Henüz fotoğraf yok",
    emptyOpen: "İlk fotoğrafı sen paylaş; etkinliğin çekilişine de katılmış olursun.",
    emptyClosed: "Bir etkinlik başladığında fotoğraflarını buradan paylaşabilirsin.",
    errorTitle: "Fotoğraflar yüklenemedi",
    errorBody: "Bağlantını kontrol edip tekrar dene.",
    retry: "Tekrar dene",
    loading: "Fotoğraflar yükleniyor",
  },
  en: {
    title: "Event photos",
    lede:
      "Photos from our events, grouped by event. A photo you share within three days of an event's start enters that event's raffle.",
    share: "Share a photo",
    openNow: "Open for photos",
    until: (date) => `until ${date}`,
    nothingOpen: "No event is open for photos right now.",
    photos: (count) => `${count} ${count === 1 ? "photo" : "photos"}`,
    otherPhotos: "Other photos",
    loadMore: "More photos",
    earlierRaffles: "Earlier raffles",
    emptyTitle: "No photos yet",
    emptyOpen: "Share the first one; it enters the event's raffle too.",
    emptyClosed: "When an event starts, you can share your photos here.",
    errorTitle: "Photos could not be loaded",
    errorBody: "Check your connection and try again.",
    retry: "Try again",
    loading: "Loading photos",
  },
};

/** Posts in the order loaded (newest first), banded by event in order of each event's newest photo. */
export function groupPostsByEvent(posts, eventsById, locale, otherLabel) {
  const groups = new Map();

  for (const post of posts) {
    const key = post.eventId || "__none";
    if (!groups.has(key)) {
      const event = post.eventId ? eventsById[post.eventId] : null;
      groups.set(key, {
        key,
        eventId: post.eventId || null,
        name:
          (event && getLocalizedField(event, "name", locale)) ||
          getLocalizedField(post, "eventName", locale) ||
          post.eventName ||
          otherLabel,
        startsAt: event?.startsAt || null,
        posts: [],
      });
    }
    groups.get(key).posts.push(post);
  }

  return [...groups.values()];
}

function OpenEvents({ events, locale, copy }) {
  if (!events) return null;

  if (events.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">{copy.nothingOpen}</p>;
  }

  const deadline = (event) => {
    const start = getEventStart(event);
    return start
      ? formatLocalizedDate(new Date(start.getTime() + POSTING_WINDOW_MS), locale, {
          timeZone: "Europe/Istanbul",
          day: "numeric",
          month: "long",
        })
      : null;
  };

  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
      <span className="flex items-center gap-2 font-medium text-ink">
        <span className="h-2 w-2 rounded-full bg-mark-green" aria-hidden="true" />
        {copy.openNow}
      </span>
      {events.map((event) => (
        <span key={event.id} className="text-ink-2">
          {getLocalizedField(event, "name", locale)}
          {deadline(event) && (
            <span className="ml-1.5 font-outlier text-xs text-muted-foreground">
              {copy.until(deadline(event))}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function LoadingBoard({ copy }) {
  return (
    <div role="status" aria-label={copy.loading} className="border-t-2 border-ink pt-3 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-x-10">
      <div>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
      </div>
      <div className={`${tileGrid} mt-4 lg:mt-0`}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>
            <Skeleton className="aspect-square w-full rounded-sm" />
            <Skeleton className="my-4 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// The social page: one band per event, newest first. Each band has the event's name, date and
// raffle result on the left (on top on phones) and its photos as a contact sheet beside them.
export default function SocialBoard({
  locale,
  groups,
  rafflesByEvent,
  earlierRaffles,
  activeEvents,
  status,
  hasMore,
  loadingMore,
  onLoadMore,
  onRetry,
  onOpenPost,
  onPostChange,
  onDelete,
  onShare,
}) {
  const copy = BOARD_COPY[locale];
  const canShare = activeEvents?.length > 0;

  // An event page links here as /social#event-<id>. The bands render after the posts load,
  // later than the browser's own jump to the anchor, so jump once they are there.
  useEffect(() => {
    if (status !== "ready" || !window.location.hash.startsWith("#event-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [status]);

  const eventDate = (startsAt) =>
    startsAt
      ? formatLocalizedDate(startsAt, locale, {
          timeZone: "Europe/Istanbul",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <PageContainer>
      {/* No hairline under the header: the first event's heavy rule closes it */}
      <PageHeader
        className="border-b-0 pb-0 md:pb-0"
        title={copy.title}
        description={copy.lede}
        actions={
          canShare && (
            <Button onClick={onShare}>
              <Plus aria-hidden="true" />
              {copy.share}
            </Button>
          )
        }
      >
        <OpenEvents events={activeEvents} locale={locale} copy={copy} />
      </PageHeader>

      {status === "loading" && <LoadingBoard copy={copy} />}

      {status === "error" && (
        <EmptyState
          title={copy.errorTitle}
          description={copy.errorBody}
          action={
            <Button variant="outline" onClick={onRetry}>
              {copy.retry}
            </Button>
          }
        />
      )}

      {status === "ready" && groups.length === 0 && (
        <EmptyState
          title={copy.emptyTitle}
          description={canShare ? copy.emptyOpen : copy.emptyClosed}
          action={canShare && <Button onClick={onShare}>{copy.share}</Button>}
        />
      )}

      {status === "ready" && groups.length > 0 && (
        <div className="space-y-14 md:space-y-20">
          {groups.map((group, index) => {
            const headingId = `social-event-${index}`;
            const raffles = (group.eventId && rafflesByEvent.get(group.eventId)) || [];
            const date = eventDate(group.startsAt);

            return (
              <section
                key={group.key}
                id={group.eventId ? `event-${group.eventId}` : undefined}
                aria-labelledby={headingId}
                className="scroll-mt-6 border-t-2 border-ink pt-3 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-x-10"
              >
                <div className="lg:sticky lg:top-6 lg:self-start">
                  <h2
                    id={headingId}
                    className="font-display text-xl font-bold leading-tight md:text-2xl"
                  >
                    {group.name}
                  </h2>
                  <p className="mt-1 font-outlier text-xs text-muted-foreground">
                    {date && <time dateTime={group.startsAt}>{date}</time>}
                    {date && " · "}
                    {copy.photos(group.posts.length)}
                  </p>
                  {raffles.map((raffle) => (
                    <AnnouncementCard
                      key={raffle.id}
                      announcement={raffle}
                      className="mt-4 border-t border-rule pt-3"
                    />
                  ))}
                </div>

                <ul className={`${tileGrid} mt-4 lg:mt-0`}>
                  {group.posts.map((post) => (
                    <li key={post.id} className="min-w-0">
                      <ErrorBoundary locale={locale}>
                        <PostCard
                          post={post}
                          sizes={TILE_SIZES}
                          onPostClick={onOpenPost}
                          onChange={onPostChange}
                          onDelete={onDelete}
                        />
                      </ErrorBoundary>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {hasMore && (
            <div className="lg:pl-[calc(15rem+2.5rem)]">
              <Button variant="outline" loading={loadingMore} onClick={onLoadMore}>
                {copy.loadMore}
              </Button>
            </div>
          )}

          {!hasMore && earlierRaffles.length > 0 && (
            <section aria-labelledby="social-earlier-raffles" className="border-t-2 border-ink pt-3">
              <h2 id="social-earlier-raffles" className="font-display text-xl font-bold">
                {copy.earlierRaffles}
              </h2>
              <ul className="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {earlierRaffles.map((raffle) => (
                  <li key={raffle.id} className="border-t border-rule pt-3">
                    <AnnouncementCard announcement={raffle} showEvent />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}
