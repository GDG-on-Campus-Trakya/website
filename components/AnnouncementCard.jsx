"use client";

import { Trophy, Gift, Calendar, Clock } from "lucide-react";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

export default function AnnouncementCard({ announcement }) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          winner: "WINNER",
          raffleResult: "Raffle Result",
          announcement: "Announcement",
        }
      : {
          winner: "KAZANAN",
          raffleResult: "Çekiliş Sonucu",
          announcement: "Duyuru",
        };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatLocalizedDate(date, locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const title = getLocalizedField(announcement, "title", locale);
  const content = getLocalizedField(announcement, "content", locale);
  const eventName =
    getLocalizedField(announcement, "eventName", locale) ||
    getLocalizedField(announcement, "name", locale);

  if (announcement.type === "raffle_result") {
    return (
      <article className="max-w-full border-b border-rule py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-sm font-medium text-ink-2">{copy.raffleResult}</span>
          <span className="flex items-center gap-1.5 font-outlier text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(announcement.createdAt)}
          </span>
        </div>

        <h3 className="mt-2 break-words font-display text-xl font-bold">{title}</h3>
        {eventName && <p className="mt-1 text-ink-2">{eventName}</p>}

        <div className="mt-4 border-y-2 border-ink py-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="rounded-sm bg-warning px-2 py-0.5 text-xs font-semibold text-ink">
              {copy.winner}
            </span>
          </div>
          <p className="mt-2 break-words font-display text-2xl font-extrabold">
            {announcement.winnerName || announcement.winner}
          </p>
          {announcement.prize && (
            <p className="mt-1 flex items-center gap-2 text-ink-2">
              <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words font-medium">
                {announcement.prize}
              </span>
            </p>
          )}
        </div>

        {content && (
          <p className="mt-4 max-w-measure whitespace-pre-line leading-relaxed text-ink-2">
            {content}
          </p>
        )}
      </article>
    );
  }

  return (
    <article className="max-w-full border-b border-rule py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {copy.announcement}
        </span>
        <span className="flex items-center gap-1.5 font-outlier text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDate(announcement.createdAt)}
        </span>
      </div>

      <h3 className="mt-2 break-words font-display text-xl font-bold">{title}</h3>
      {eventName && <p className="mt-1 text-sm text-muted-foreground">{eventName}</p>}

      <p className="mt-3 max-w-measure whitespace-pre-line leading-relaxed text-ink-2">
        {content}
      </p>
    </article>
  );
}
