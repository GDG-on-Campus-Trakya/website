"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
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
    return <p className="text-gray-400">{copy.empty}</p>;
  }

  return (
    <ul className="flex list-none flex-col gap-5 p-0">
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
        const statusColor = status === copy.upcoming ? "bg-green-600" : "bg-red-600";
        const eventName = getLocalizedField(event, "name", locale);
        const eventLocation = getLocalizedField(event, "location", locale);
        const eventCategory = getLocalizedField(event, "category", locale);

        return (
          <motion.li
            key={registration.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            className="flex flex-col items-start space-y-4 rounded-lg bg-gray-800 p-5 shadow-md md:flex-row md:items-center md:space-x-6 md:space-y-0"
          >
            <img
              src={event.imageUrl || "/logo.svg"}
              alt={eventName}
              className="h-32 w-32 rounded object-cover"
            />

            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-white">{eventName}</h3>
              <div className="mt-2">
                <p>
                  <strong>{copy.eventDate}:</strong>{" "}
                  {formatLocalizedDate(event.date, locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  {event.time}
                </p>
                <p>
                  <strong>{copy.eventLocation}:</strong> {eventLocation}
                </p>
                <p>
                  <strong>{copy.registrationDate}:</strong> {signedUpDate}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
                  {eventCategory}
                </span>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm text-white ${statusColor}`}
                >
                  {status}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {!expired && qrCodes[registration.qrCodeId] && (
                <div className="flex flex-col items-center gap-2">
                  <motion.img
                    src={qrCodes[registration.qrCodeId]}
                    alt="QR Code"
                    className="h-32 w-32 cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() =>
                      setEnlargedQR({
                        qrCode: qrCodes[registration.qrCodeId],
                        eventName,
                      })
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  <button
                    onClick={() =>
                      downloadQRCode(qrCodes[registration.qrCodeId], eventName)
                    }
                    className="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                  >
                    {copy.download}
                  </button>
                </div>
              )}
              {!expired && (
                <button
                  onClick={() => removeRegistration(registration)}
                  className="w-full rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
                >
                  {copy.remove}
                </button>
              )}
              {expired && <p className="text-center text-gray-500">{copy.expiredQr}</p>}
            </div>
          </motion.li>
        );
      })}

      <AnimatePresence>
        {enlargedQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setEnlargedQR(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="mx-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="truncate text-lg font-semibold text-gray-800">
                  {enlargedQR.eventName}
                </h3>
                <button
                  onClick={() => setEnlargedQR(null)}
                  className="rounded-full p-1 transition-colors hover:bg-gray-100"
                >
                  <svg
                    className="h-6 w-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <img
                    src={enlargedQR.qrCode}
                    alt="QR Code"
                    className="h-64 w-64 sm:h-80 sm:w-80"
                  />
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() =>
                      downloadQRCode(enlargedQR.qrCode, enlargedQR.eventName)
                    }
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
                  >
                    {copy.download}
                  </button>
                  <button
                    onClick={() => setEnlargedQR(null)}
                    className="flex-1 rounded-lg bg-gray-500 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
                  >
                    {copy.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ul>
  );
};

export default EventList;
