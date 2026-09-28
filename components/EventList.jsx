"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/page";
import {
  formatLocalizedDate,
  getLocalizedField,
} from "@/utils/localeUtils";

const COPY = {
  tr: {
    empty: "Henüz bir etkinliğe kayıt olmadınız.",
    eventDate: "Etkinlik Tarihi",
    eventLocation: "Etkinlik Lokasyonu",
    registrationDate: "Kayıt Tarihi",
    upcoming: "Yaklaşan",
    past: "Geçmiş",
    download: "Kodu İndir",
    remove: "Kayıt Sil",
    expiredQr: "Bu etkinlik sona erdiği için QR kodu mevcut değil.",
    close: "Kapat",
  },
  en: {
    empty: "You have not registered for any events yet.",
    eventDate: "Event Date",
    eventLocation: "Event Location",
    registrationDate: "Registration Date",
    upcoming: "Upcoming",
    past: "Past",
    download: "Download Code",
    remove: "Remove Registration",
    expiredQr: "This event has ended, so its QR code is no longer available.",
    close: "Close",
  },
};

const isExpired = (eventDate, eventTime, isClient = true) => {
  if (!isClient) return false;
  const now = new Date();
  const [hours, minutes] = eventTime.split(":").map(Number);
  const eventDateTime = new Date(eventDate);
  eventDateTime.setHours(hours, minutes, 0, 0);

  const graceEndTime = new Date(eventDateTime);
  graceEndTime.setHours(graceEndTime.getHours() + 6);

  return now > graceEndTime;
};

const EventList = ({
  registrations,
  events,
  removeRegistration,
  qrCodes,
  downloadQRCode,
}) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [enlargedQR, setEnlargedQR] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (enlargedQR) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    };
  }, [enlargedQR]);

  if (registrations.length === 0) {
    return <EmptyState title={copy.empty} />;
  }

  return (
    <>
      <ul className="list-none border-t-2 border-ink p-0">
        {registrations.map((registration) => {
          const event = events.find((entry) => entry.id === registration.eventId);
          if (!event) return null;

          const signedUpAtValue =
            registration.signedUpAt?.seconds != null
              ? registration.signedUpAt.seconds * 1000
              : registration.signedUpAt || (isClient ? Date.now() : 0);
          const signedUpDate = formatLocalizedDate(signedUpAtValue, locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const expired = isExpired(event.date, event.time, isClient);
          const status = expired ? copy.past : copy.upcoming;
          const eventName = getLocalizedField(event, "name", locale);
          const eventLocation = getLocalizedField(event, "location", locale);
          const eventCategory = getLocalizedField(event, "category", locale);

          return (
            <li
              key={registration.id}
              className="grid gap-x-6 gap-y-4 border-b border-rule py-5 md:grid-cols-[8rem_minmax(0,1fr)_auto]"
            >
              <img
                src={event.imageUrl || "/logo.svg"}
                alt={eventName}
                className="aspect-square w-32 rounded bg-paper-2 object-cover"
              />

              <div className="min-w-0">
                <h3 className="font-display text-xl font-bold leading-tight">
                  {eventName}
                </h3>
                <dl className="mt-2 space-y-1 text-sm">
                  <div>
                    <dt className="inline text-muted-foreground">{copy.eventDate}:</dt>{" "}
                    <dd className="inline font-outlier tabular-nums">
                      {formatLocalizedDate(event.date, locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      {event.time}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">{copy.eventLocation}:</dt>{" "}
                    <dd className="inline">{eventLocation}</dd>
                  </div>
                  <div>
                    <dt className="inline text-muted-foreground">{copy.registrationDate}:</dt>{" "}
                    <dd className="inline font-outlier tabular-nums">{signedUpDate}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{eventCategory}</Badge>
                  <Badge variant={expired ? "neutral" : "success"}>{status}</Badge>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:w-44">
                {!expired && qrCodes[registration.qrCodeId] && (
                  <div className="flex flex-col items-start gap-3 md:items-stretch">
                    <button
                      type="button"
                      className="block w-32 rounded border border-rule bg-background p-1 transition-colors duration-micro ease-out hover:bg-paper-2 md:mx-auto"
                      onClick={() =>
                        setEnlargedQR({
                          qrCode: qrCodes[registration.qrCodeId],
                          eventName,
                        })
                      }
                    >
                      <img
                        src={qrCodes[registration.qrCodeId]}
                        alt="QR Code"
                        className="h-full w-full"
                      />
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        downloadQRCode(qrCodes[registration.qrCodeId], eventName)
                      }
                    >
                      {copy.download}
                    </Button>
                  </div>
                )}
                {!expired && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-error text-error"
                    onClick={() => removeRegistration(registration)}
                  >
                    {copy.remove}
                  </Button>
                )}
                {expired && (
                  <p className="text-sm text-muted-foreground">{copy.expiredQr}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {enlargedQR && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4 animate-in fade-in-0 duration-short"
          onClick={() => setEnlargedQR(null)}
        >
          <div
            className="mx-auto w-full max-w-sm rounded-lg border border-rule bg-background p-6 text-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="min-w-0 truncate font-display text-lg font-bold">
                {enlargedQR.eventName}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={copy.close}
                onClick={() => setEnlargedQR(null)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded border border-rule bg-background p-3">
                <img
                  src={enlargedQR.qrCode}
                  alt="QR Code"
                  className="h-64 w-64 max-w-full sm:h-80 sm:w-80"
                />
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() =>
                    downloadQRCode(enlargedQR.qrCode, enlargedQR.eventName)
                  }
                >
                  {copy.download}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEnlargedQR(null)}
                >
                  {copy.close}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventList;
