"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Maximize2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEventStart } from "@/utils/eventTime";
import {
  formatLocalizedDate,
  getLocalizedField,
  withYearIfNotCurrent,
} from "@/utils/localeUtils";

const COPY = {
  tr: {
    upcoming: "Yaklaşan biletlerin",
    past: "Geçmiş etkinliklerin",
    showAtDoor: "Girişte bu QR kodu göster.",
    qrLoading: "QR kod hazırlanıyor…",
    qrMissing: "Bu kaydın QR kodu bulunamadı. Destek talebi açarsan yardımcı oluruz.",
    enlarge: "Büyüt",
    enlargeLabel: (name) => `${name} QR kodunu büyüt`,
    enlargedHelp: "Ekran parlaklığını artırırsan daha kolay okunur.",
    download: "QR kodu indir",
    eventPage: "Etkinlik sayfası",
    cancel: "Kaydı iptal et",
    attended: "Katıldın",
    qrAlt: (name) => `${name} QR bileti`,
  },
  en: {
    upcoming: "Your upcoming tickets",
    past: "Your past events",
    showAtDoor: "Show this QR code at the door.",
    qrLoading: "Preparing the QR code…",
    qrMissing: "The QR code for this registration is missing. Open a support request and we will help.",
    enlarge: "Enlarge",
    enlargeLabel: (name) => `Enlarge the QR code for ${name}`,
    enlargedHelp: "Turning up the screen brightness makes it easier to scan.",
    download: "Download QR code",
    eventPage: "Event page",
    cancel: "Cancel registration",
    attended: "Attended",
    qrAlt: (name) => `QR ticket for ${name}`,
  },
};

// An event counts as past six hours after it starts, so the ticket stays up during the event.
const GRACE_MS = 6 * 60 * 60 * 1000;

const textLink =
  "inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2";

// The profile as a ticket wallet: upcoming tickets first, soonest on top, each with a QR code
// large enough to scan at the door; past events as a short list underneath.
export default function EventList({
  registrations,
  events,
  removeRegistration,
  qrCodes,
  downloadQRCode,
}) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [enlarged, setEnlarged] = useState(null);

  const now = Date.now();
  const tickets = registrations
    .map((registration) => {
      const event = events.find((entry) => entry.id === registration.eventId);
      if (!event) return null;
      const start = getEventStart(event);
      return {
        registration,
        event,
        start,
        name: getLocalizedField(event, "name", locale),
        location: getLocalizedField(event, "location", locale),
        ended: start ? now > start.getTime() + GRACE_MS : false,
      };
    })
    .filter(Boolean);

  const upcoming = tickets
    .filter((ticket) => !ticket.ended)
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
  const past = tickets
    .filter((ticket) => ticket.ended)
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  const longDate = (date) =>
    formatLocalizedDate(
      date,
      locale,
      withYearIfNotCurrent(date, {
        timeZone: "Europe/Istanbul",
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
  const shortDate = (date) =>
    formatLocalizedDate(date, locale, {
      timeZone: "Europe/Istanbul",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const eventHref = (event) => `/events/${event.docId ?? event.id}`;

  return (
    <>
      {upcoming.length > 0 && (
        <section aria-labelledby="tickets-upcoming">
          <h3 id="tickets-upcoming" className="sr-only">
            {copy.upcoming}
          </h3>
          <ul>
            {upcoming.map(({ registration, event, start, name, location }) => {
              const qrCode = qrCodes[registration.qrCodeId];

              return (
                <li key={registration.id} className="border-b border-rule py-6 first:pt-2">
                  {/* Phone: name, QR, then the links. Wider: the QR sits beside both. */}
                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:grid-rows-[auto_1fr]">
                    <div className="min-w-0 sm:col-start-1 sm:row-start-1">
                      {start && (
                        <p className="font-outlier text-sm capitalize text-muted-foreground">
                          <time dateTime={start.toISOString()}>{longDate(start)}</time>
                          {event.time && <span> · {event.time}</span>}
                        </p>
                      )}
                      <h4 className="mt-1 font-display text-2xl font-bold leading-tight">{name}</h4>
                      {location && <p className="mt-1 text-ink-2">{location}</p>}
                    </div>

                    <div className="sm:col-start-2 sm:row-span-2 sm:row-start-1">
                      {qrCode ? (
                        <button
                          type="button"
                          onClick={() => setEnlarged({ qrCode, name })}
                          aria-label={copy.enlargeLabel(name)}
                          className="group block w-full max-w-[16rem] rounded border border-rule bg-background p-2 transition-colors duration-micro ease-out hover:border-ink sm:max-w-none"
                        >
                          <img src={qrCode} alt={copy.qrAlt(name)} className="aspect-square w-full" />
                          <span className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground group-hover:text-ink">
                            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {copy.enlarge}
                          </span>
                        </button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {registration.qrCodeId ? copy.qrLoading : copy.qrMissing}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-start-1 sm:row-start-2">
                      <p className="text-sm text-ink-2">{copy.showAtDoor}</p>
                      <div className="mt-1 flex flex-wrap gap-x-5">
                        <Link href={eventHref(event)} className={textLink}>
                          {copy.eventPage}
                        </Link>
                        {qrCode && (
                          <button
                            type="button"
                            className={textLink}
                            onClick={() => downloadQRCode(qrCode, name)}
                          >
                            {copy.download}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kept apart from the QR code so it is not tapped by accident at the door */}
                  <div className="mt-6 border-t border-dashed border-rule pt-2">
                    <button
                      type="button"
                      onClick={() => removeRegistration({ ...registration, eventName: name })}
                      className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-error underline underline-offset-4 decoration-1 hover:decoration-2"
                    >
                      {copy.cancel}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="tickets-past" className={upcoming.length > 0 ? "mt-10" : ""}>
          <h3 id="tickets-past" className="border-t-2 border-ink pt-3 font-display text-lg font-bold">
            {copy.past}
          </h3>
          <ul className="mt-2">
            {past.map(({ registration, event, start, name }) => (
              <li key={registration.id}>
                <Link
                  href={eventHref(event)}
                  className="group grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-rule py-3 transition-colors duration-micro ease-out hover:bg-paper-2"
                >
                  <time
                    dateTime={start.toISOString()}
                    className="font-outlier text-sm text-muted-foreground"
                  >
                    {shortDate(start)}
                  </time>
                  <span className="font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                    {name}
                  </span>
                  {registration.didJoinEvent ? (
                    <Badge variant="success">{copy.attended}</Badge>
                  ) : (
                    <span />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={Boolean(enlarged)} onOpenChange={(open) => !open && setEnlarged(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="pr-10">{enlarged?.name}</DialogTitle>
            <DialogDescription>{copy.enlargedHelp}</DialogDescription>
          </DialogHeader>
          {enlarged && (
            <>
              <img
                src={enlarged.qrCode}
                alt={copy.qrAlt(enlarged.name)}
                className="aspect-square w-full rounded border border-rule"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadQRCode(enlarged.qrCode, enlarged.name)}
              >
                {copy.download}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
