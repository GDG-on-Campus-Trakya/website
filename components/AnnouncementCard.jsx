"use client";

import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

const COPY = {
  tr: { winner: "Kazanan", prize: "Ödül" },
  en: { winner: "Winner", prize: "Prize" },
};

// A raffle result as it sits beside its event on the social board: the winner's name set large,
// the prize under it. `showEvent` adds the event name for results listed on their own.
export default function AnnouncementCard({ announcement, showEvent = false, className }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  const created = announcement.createdAt?.toDate
    ? announcement.createdAt.toDate()
    : announcement.createdAt && new Date(announcement.createdAt);
  const eventName =
    getLocalizedField(announcement, "eventName", locale) || announcement.eventName;
  const winner = announcement.winnerName || announcement.winner;

  return (
    <div className={cn("min-w-0", className)}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* Winner gold: the colour carries the meaning here (design.md § Preserve) */}
        <Badge variant="warning">{copy.winner}</Badge>
        {created && (
          <time
            dateTime={created.toISOString()}
            className="font-outlier text-xs text-muted-foreground"
          >
            {formatLocalizedDate(created, locale, { day: "numeric", month: "short", year: "numeric" })}
          </time>
        )}
      </p>
      <p className="mt-1.5 break-words font-display text-lg font-bold leading-tight">{winner}</p>
      {announcement.prize && (
        <p className="mt-0.5 break-words text-sm text-ink-2">
          <span className="sr-only">{copy.prize}: </span>
          {announcement.prize}
        </p>
      )}
      {showEvent && eventName && (
        <p className="mt-0.5 break-words text-sm text-muted-foreground">{eventName}</p>
      )}
    </div>
  );
}
