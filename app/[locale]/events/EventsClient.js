"use client";

import { useAccount } from "@/app/AuthProvider";
import { db } from "@/firebase";
import { logger } from "@/utils/logger";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { loginHref } from "@/utils/redirect";
import Calendar from "@/components/Calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Check, ChevronLeft, ChevronRight, Clock, Download } from "lucide-react";
import AcademicFields from "@/components/AcademicFields";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageContainer, PageHeader, Skeleton } from "@/components/ui/page";
import { canOptimizeImage } from "@/lib/images";
import {
  formatLocalizedDate,
  getLocalizedField,
  getLocaleCode,
} from "@/utils/localeUtils";
import { getEventStart } from "@/utils/eventTime";

// Only the drawer shows descriptions; the Markdown parser (about 45 KB) loads when it opens.
const MarkdownRenderer = dynamic(() => import("@/components/MarkdownRenderer"));

const COPY = {
  tr: {
    title: "Etkinlikler",
    subtitle: "Katılmak istediğiniz etkinlikleri keşfedin ve kaydolun!",
    upcoming: "Yaklaşan",
    past: "Geçmiş",
    today: "Bugün",
    tomorrow: "Yarın",
    noEvents: "Yaklaşan bir etkinlik yok. Takipte kalın!",
    noEventsOnDate: "Bu günde etkinlik yok.",
    clearDate: "Tüm etkinlikler",
    loading: "Yükleniyor...",
    error: "Hata",
    category: "Kategori",
    location: "Lokasyon",
    sponsors: "Sponsorluk",
    documents: "Etkinlik Dokümanları",
    signedUp: "Kayıt Olundu",
    signUp: "Kayıt Ol",
    signInToSignUp: "Kayıt Olmak için Giriş Yapın",
    eventEnded: "Bu etkinlik sona erdi.",
    close: "Kapat",
    previous: "Önceki etkinlik",
    next: "Sonraki etkinlik",
    completeTitle: "Kayıttan önce birkaç bilgi",
    completeBody:
      "Katılımcıları tanımak için adını, fakülteni ve bölümünü bir kez soruyoruz. Profiline kaydedilir.",
    fullName: "Ad soyad",
    nameRequired: "Adını yaz.",
    facultyRequired: "Fakülteni seç.",
    departmentRequired: "Bölümünü seç ya da yaz.",
    saveAndSignUp: "Kaydet ve kayıt ol",
    ticketReady: "Kaydın alındı. QR biletin profilinde; girişte onu göster.",
    viewTicket: "Biletime git",
    signupError: "Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.",
    qrEventMissing: "QR kod için etkinlik bulunamadı.",
    invalidQr: "Geçersiz QR kod.",
    qrError: "QR kod işlenirken bir hata oluştu.",
    sponsorFallback: "Sponsor",
    eventPage: "Etkinlik sayfası",
    archive: "Geçmiş etkinlikler",
  },
  en: {
    title: "Events",
    subtitle: "Discover the events you want to join and register easily.",
    upcoming: "Upcoming",
    past: "Past",
    today: "Today",
    tomorrow: "Tomorrow",
    noEvents: "There are no upcoming events right now. Check back soon.",
    noEventsOnDate: "No events on this day.",
    clearDate: "All events",
    loading: "Loading...",
    error: "Error",
    category: "Category",
    location: "Location",
    sponsors: "Sponsors",
    documents: "Event Documents",
    signedUp: "Registered",
    signUp: "Register",
    signInToSignUp: "Sign in to register",
    eventEnded: "This event has ended.",
    close: "Close",
    previous: "Previous event",
    next: "Next event",
    completeTitle: "A few details before you register",
    completeBody:
      "We ask once for your name, faculty and department so we know who is coming. They are saved to your profile.",
    fullName: "Full name",
    nameRequired: "Enter your name.",
    facultyRequired: "Choose your faculty.",
    departmentRequired: "Choose or type your department.",
    saveAndSignUp: "Save and register",
    ticketReady: "You are registered. Your QR ticket is on your profile; show it at the door.",
    viewTicket: "Go to my ticket",
    signupError: "An error occurred while registering. Please try again.",
    qrEventMissing: "No event was found for this QR code.",
    invalidQr: "Invalid QR code.",
    qrError: "An error occurred while processing the QR code.",
    sponsorFallback: "Sponsor",
    eventPage: "Event page",
    archive: "Past events",
  },
};

function SearchParamsHandler({ onQRCodeRedirect, onEventParam, events }) {
  const searchParams = useSearchParams();
  const processedQRCodes = useRef(new Set());
  const processedEventParam = useRef(null);

  // /events?event=<id> (linked from the event's own page) opens that event's drawer
  useEffect(() => {
    const eventId = searchParams.get("event");

    if (eventId && events.length > 0 && processedEventParam.current !== eventId) {
      processedEventParam.current = eventId;
      onEventParam(eventId);
    }
  }, [searchParams, events, onEventParam]);

  useEffect(() => {
    const handleQRCodeRedirect = async () => {
      const qrCodeId = searchParams.get("qrCode");

      if (
        qrCodeId &&
        events.length > 0 &&
        !processedQRCodes.current.has(qrCodeId)
      ) {
        processedQRCodes.current.add(qrCodeId);
        onQRCodeRedirect(qrCodeId);
      }
    };

    if (events.length > 0) {
      handleQRCodeRedirect();
    }
  }, [searchParams, events, onQRCodeRedirect]);

  return null;
}

function EventsPageContent({ initialEvents, initialSponsors, serverNow }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [sponsors, setSponsors] = useState(initialSponsors);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Below lg the calendar sits under the list; picking a day scrolls back up to the results.
  const listRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [filterStatus, setFilterStatus] = useState("upcoming");
  const { user, profile, mergeProfile } = useAccount();
  const [signingUp, setSigningUp] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [details, setDetails] = useState({ name: "", faculty: "", department: "" });
  const [detailErrors, setDetailErrors] = useState({});
  const [isClient, setIsClient] = useState(false);
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [imageCache, setImageCache] = useState(new Map());

  useEffect(() => {
    setIsClient(true);
    setCurrentMonth(new Date());
  }, []);

  useEffect(() => {
    if (selectedEvent) {
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
  }, [selectedEvent]);

  const loadImageOptimized = (imageUrl, isMobile = false) =>
    new Promise((resolve) => {
      if (imageCache.has(imageUrl)) {
        resolve(true);
        return;
      }

      const img = new window.Image();
      const timeout = setTimeout(() => resolve(false), isMobile ? 150 : 500);

      img.onload = () => {
        clearTimeout(timeout);
        setImageCache((prev) => new Map(prev.set(imageUrl, true)));
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = imageUrl;
    });

  const formatDateKey = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getEventName = (event) => getLocalizedField(event, "name", locale);
  const getEventDescription = (event) =>
    getLocalizedField(event, "description", locale);
  const getEventLocation = (event) =>
    getLocalizedField(event, "location", locale);
  const getEventCategory = (event) =>
    getLocalizedField(event, "category", locale);
  const getSponsorName = (sponsor) =>
    getLocalizedField(sponsor, "name", locale) || copy.sponsorFallback;

  // Before hydration "now" is the moment the page was rendered on the server, so the
  // server HTML and the first client render agree.
  const getNow = () => (isClient ? new Date() : new Date(serverNow));

  const isExpired = (event) => {
    const start = getEventStart(event);
    return start ? getNow() > start : false;
  };

  useEffect(() => {
    const checkSignupStatus = async () => {
      if (!user || !selectedEvent) {
        setHasSignedUp(false);
        return;
      }

      try {
        const registrationsRef = collection(db, "registrations");
        const signupQuery = query(
          registrationsRef,
          where("eventId", "==", selectedEvent.id),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(signupQuery);
        setHasSignedUp(!querySnapshot.empty);
      } catch (signupStatusError) {
        logger.error("Error checking signup status:", signupStatusError);
      }
    };

    checkSignupStatus();
  }, [user, selectedEvent]);

  // Registration needs name, faculty and department. Accounts made with Google have none of
  // the last two, so the drawer asks for whatever is missing instead of sending people away.
  const missingDetails = user
    ? ["name", "faculty", "department"].filter((field) => !profile?.[field]?.trim())
    : [];

  useEffect(() => {
    setDetails({
      name: profile?.name || user?.displayName || "",
      faculty: profile?.faculty || "",
      department: profile?.department || "",
    });
    setDetailErrors({});
  }, [profile, user]);

  useEffect(() => {
    setJustSignedUp(false);
  }, [selectedEvent]);

  const handleSignup = async () => {
    if (!user || !selectedEvent || signingUp) return;

    setSigningUp(true);

    if (missingDetails.length > 0) {
      const fields = {
        name: details.name.trim(),
        faculty: details.faculty.trim(),
        department: details.department.trim(),
      };
      const errors = {
        name: fields.name ? undefined : copy.nameRequired,
        faculty: fields.faculty ? undefined : copy.facultyRequired,
        department: fields.department ? undefined : copy.departmentRequired,
      };
      setDetailErrors(errors);
      if (errors.name || errors.faculty || errors.department) {
        setSigningUp(false);
        return;
      }

      try {
        await setDoc(doc(db, "users", user.uid), { ...fields, email: user.email }, { merge: true });
        mergeProfile(fields);
      } catch (saveError) {
        logger.error("Error saving profile details:", saveError);
        toast.error(copy.signupError);
        setSigningUp(false);
        return;
      }
    }

    try {
      const registrationsRef = collection(db, "registrations");
      const existing = await getDocs(
        query(
          registrationsRef,
          where("eventId", "==", selectedEvent.id),
          where("userId", "==", user.uid)
        )
      );

      if (existing.empty) {
        // The registration and its QR code are written together, so a failure never leaves a
        // registration without a ticket.
        const registrationRef = doc(registrationsRef);
        const qrCodeRef = doc(collection(db, "qrCodes"));
        const batch = writeBatch(db);
        batch.set(registrationRef, {
          eventId: selectedEvent.id,
          userId: user.uid,
          signedUpAt: new Date(),
          didJoinEvent: false,
          qrCodeId: qrCodeRef.id,
        });
        batch.set(qrCodeRef, {
          registrationId: registrationRef.id,
          createdAt: new Date(),
          code: `qrCode=${qrCodeRef.id}`,
        });
        await batch.commit();
      }

      setHasSignedUp(true);
      setJustSignedUp(true);
    } catch (signupError) {
      logger.error("Error signing up for event:", signupError);
      toast.error(copy.signupError);
    } finally {
      setSigningUp(false);
    }
  };

  const handleEventParam = (eventId) => {
    const event = events.find((entry) => (entry.docId ?? entry.id) === eventId);
    if (event) handleEventClick(event);

    if (isClient) {
      const url = new URL(window.location);
      url.searchParams.delete("event");
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleQRCodeRedirect = async (qrCodeId) => {
    if (qrCodeId && !selectedEvent && events.length > 0) {
      try {
        if (isClient) {
          const url = new URL(window.location);
          if (url.searchParams.has("qrCode")) {
            url.searchParams.delete("qrCode");
            window.history.replaceState(null, "", url.toString());
          }
        }

        const qrCodeRef = doc(db, "eventQrCodes", qrCodeId);
        const qrCodeSnap = await getDoc(qrCodeRef);

        if (qrCodeSnap.exists()) {
          const eventId = qrCodeSnap.data().eventId;
          const event = events.find((entry) => entry.id === eventId);

          if (event) {
            setSelectedEvent(event);
          } else {
            toast.error(copy.qrEventMissing);
          }
        } else {
          toast.error(copy.invalidQr);
        }
      } catch (qrError) {
        logger.error("Error handling QR code redirect:", qrError);
        toast.error(copy.qrError);
      }
    }
  };

  useEffect(() => {
    // The server already sent the events; fall back to Firestore only when it could not
    if (initialEvents.length > 0) return;

    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        if (!eventsSnapshot.empty) {
          const eventsData = eventsSnapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
          }));
          eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
          setEvents(eventsData);
        } else {
          setEvents([]);
        }

        const sponsorsSnapshot = await getDocs(collection(db, "sponsors"));
        if (!sponsorsSnapshot.empty) {
          const sponsorsData = sponsorsSnapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
          }));
          setSponsors(sponsorsData);
        } else {
          setSponsors([]);
        }
      } catch (fetchError) {
        logger.error("Error fetching data:", fetchError);
        setEvents([]);
        setSponsors([]);
      }
    };

    fetchData();
  }, [initialEvents.length]);

  const eventDates = useMemo(
    () => new Set(events.map((event) => formatDateKey(event.date))),
    [events]
  );

  const getDayLabel = (date) => {
    const eventDate = new Date(date);

    if (!isClient) {
      return formatLocalizedDate(eventDate, locale, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate.toDateString() === today.toDateString()) {
      return copy.today;
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (eventDate.toDateString() === tomorrow.toDateString()) {
      return copy.tomorrow;
    }

    return formatLocalizedDate(eventDate, locale, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // The drawer waits briefly for its image; start the download when the visitor points at
  // or touches an event, so it is usually there by the click.
  const warmEventImage = (event) => {
    if (event.imageUrl) loadImageOptimized(event.imageUrl);
  };

  const handleEventClick = async (event) => {
    setDrawerLoading(true);
    setSelectedEvent(event);

    const isMobile = isClient ? window.innerWidth <= 768 : false;

    if (event.imageUrl) {
      await loadImageOptimized(event.imageUrl, isMobile);
    }

    setDrawerLoading(false);
  };

  const closeDrawer = () => {
    setSelectedEvent(null);

    if (isClient) {
      setTimeout(() => {
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("overflow-x");
        document.body.style.removeProperty("overflow-y");
        document.body.style.removeProperty("pointer-events");
        document.body.style.removeProperty("touch-action");
        document.body.classList.remove("overflow-hidden");
        document.documentElement.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("touch-action");
        document.body.style.touchAction = "auto";
        document.documentElement.style.touchAction = "auto";
      }, 100);
    }
  };

  const showRelativeEvent = async (offset) => {
    if (!selectedEvent || filteredEvents.length === 0) return;

    const currentIndex = filteredEvents.findIndex(
      (event) => event.id === selectedEvent.id
    );
    const nextIndex =
      (currentIndex + offset + filteredEvents.length) % filteredEvents.length;
    const nextEvent = filteredEvents[nextIndex];

    setDrawerLoading(true);
    setSelectedEvent(nextEvent);

    const isMobile = isClient ? window.innerWidth <= 768 : false;

    if (nextEvent.imageUrl) {
      await loadImageOptimized(nextEvent.imageUrl, isMobile);
    }

    setDrawerLoading(false);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    if (
      selectedDate &&
      clickedDate.toDateString() === selectedDate.toDateString()
    ) {
      setSelectedDate(null);
      setFilterStatus("upcoming");
    } else {
      setSelectedDate(clickedDate);
      setFilterStatus(null);

      if (window.matchMedia("(max-width: 1023px)").matches) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        requestAnimationFrame(() =>
          listRef.current?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start"
          })
        );
      }
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (selectedDate) {
      const selectedDateStr = formatDateKey(selectedDate);
      filtered = filtered.filter(
        (event) => formatDateKey(event.date) === selectedDateStr
      );
    } else if (filterStatus === "upcoming") {
      const now = getNow();
      filtered = filtered.filter((event) => {
        const start = getEventStart(event);
        return start ? start >= now : false;
      });
      filtered.sort((a, b) => getEventStart(a) - getEventStart(b));
    } else if (filterStatus === "past") {
      const now = getNow();
      filtered = filtered.filter((event) => {
        const start = getEventStart(event);
        return start ? start < now : false;
      });
      filtered.sort((a, b) => getEventStart(b) - getEventStart(a));
    }

    return filtered;
  }, [events, selectedDate, filterStatus, isClient, serverNow]);

  // Past events stay reachable as plain links even while the "upcoming" tab is empty
  const archiveEvents = useMemo(() => {
    const now = getNow();
    return events
      .filter((event) => {
        const start = getEventStart(event);
        return start ? start < now : false;
      })
      .sort((a, b) => getEventStart(b) - getEventStart(a))
      .slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, isClient, serverNow]);

  const getSponsorsDetails = (sponsorIds) =>
    sponsors.filter((sponsor) => sponsorIds.includes(sponsor.id));

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.subtitle} />

      <Suspense fallback={null}>
        <SearchParamsHandler
          onQRCodeRedirect={handleQRCodeRedirect}
          onEventParam={handleEventParam}
          events={events}
        />
      </Suspense>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <aside className="order-2 min-w-0 lg:sticky lg:top-6 lg:col-span-4 lg:self-start">
          {currentMonth && (
            <Calendar
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              handleDateClick={handleDateClick}
              eventDates={eventDates}
            />
          )}
        </aside>

        <section ref={listRef} className="order-1 min-w-0 scroll-mt-20 lg:col-span-8">
          {!selectedDate && (
            <div role="group" className="flex gap-6 border-b border-rule">
              <button
                type="button"
                aria-pressed={filterStatus === "upcoming"}
                className={`-mb-px min-h-11 whitespace-nowrap border-b-2 text-sm font-medium transition-colors duration-micro ease-out ${
                  filterStatus === "upcoming"
                    ? "border-ink text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink"
                }`}
                onClick={() => {
                  setFilterStatus("upcoming");
                  setSelectedDate(null);
                }}
              >
                {copy.upcoming}
              </button>
              <button
                type="button"
                aria-pressed={filterStatus === "past"}
                className={`-mb-px min-h-11 whitespace-nowrap border-b-2 text-sm font-medium transition-colors duration-micro ease-out ${
                  filterStatus === "past"
                    ? "border-ink text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink"
                }`}
                onClick={() => {
                  setFilterStatus("past");
                  setSelectedDate(null);
                }}
              >
                {copy.past}
              </button>
            </div>
          )}

          {selectedDate && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-rule">
              <p className="font-outlier text-sm capitalize text-ink">
                {formatLocalizedDate(selectedDate, locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setFilterStatus("upcoming");
                }}
                className="min-h-11 rounded-sm text-sm font-medium text-brand underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {copy.clearDate}
              </button>
            </div>
          )}

          {filteredEvents.length > 0 ? (
            <ul>
              {filteredEvents.map((event) => {
                const expired = isExpired(event);

                return (
                  <li key={event.id} className="border-b border-rule">
                    <button
                      type="button"
                      className="group grid w-full gap-x-6 gap-y-3 pt-5 pb-3 text-left transition-colors duration-micro ease-out hover:bg-paper-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[minmax(0,1fr)_10rem]"
                      onClick={() => handleEventClick(event)}
                      onMouseEnter={() => warmEventImage(event)}
                      onTouchStart={() => warmEventImage(event)}
                      onFocus={() => warmEventImage(event)}
                    >
                      {event.imageUrl && (
                        <span className="relative block aspect-[16/9] overflow-hidden rounded bg-paper-2 sm:order-2 sm:aspect-[4/3]">
                          {/* 160px wide from sm up; the original is about 800px */}
                          <Image
                            src={event.imageUrl}
                            alt={getEventName(event)}
                            fill
                            sizes="(min-width: 640px) 160px, 100vw"
                            unoptimized={!canOptimizeImage(event.imageUrl)}
                            className="object-cover"
                          />
                        </span>
                      )}

                      <span className="block min-w-0 sm:order-1">
                        <span className="block font-outlier text-sm capitalize text-muted-foreground">
                          {getDayLabel(event.date)} · {event.time}
                        </span>
                        <span className="mt-1 block font-display text-xl font-bold leading-tight tracking-tight group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4 md:text-2xl">
                          {getEventName(event)}
                        </span>
                        <span className="mt-1 block text-ink-2">
                          {getEventLocation(event)}
                        </span>
                        <span className="mt-3 flex flex-wrap gap-2">
                          <Badge>{getEventCategory(event)}</Badge>
                          <Badge variant={expired ? "neutral" : "success"}>
                            {expired ? copy.past : copy.upcoming}
                          </Badge>
                        </span>
                      </span>
                    </button>
                    <Link
                      href={`/events/${event.docId ?? event.id}`}
                      className="mb-4 inline-flex min-h-11 items-center text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2"
                    >
                      {copy.eventPage} →
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title={selectedDate ? copy.noEventsOnDate : copy.noEvents}
              className="mt-6"
            />
          )}

          {filterStatus === "upcoming" && !selectedDate && archiveEvents.length > 0 && (
            <nav aria-labelledby="events-archive" className="mt-12">
              <h2
                id="events-archive"
                className="border-t-2 border-ink pt-3 font-display text-xl font-bold"
              >
                {copy.archive}
              </h2>
              <ul>
                {archiveEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.docId ?? event.id}`}
                      className="group grid grid-cols-[7.5rem_1fr] items-baseline gap-x-4 border-b border-rule py-3 transition-colors duration-micro ease-out hover:bg-paper-2"
                    >
                      <time
                        dateTime={event.startsAt}
                        className="font-outlier text-sm text-muted-foreground"
                      >
                        {formatLocalizedDate(getEventStart(event), locale, {
                          timeZone: "Europe/Istanbul",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      <span className="font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                        {getEventName(event)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </section>
      </div>

      <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className="max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:border-t md:bottom-0 md:left-auto md:right-0 md:top-0 md:h-screen md:w-[400px] md:rounded-none md:border-l">
          <div className="h-full touch-pan-y overflow-y-auto overscroll-contain p-6">
            <DrawerHeader className="p-0 text-left sm:text-left">
              <div className="mb-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={copy.previous}
                  onClick={() => showRelativeEvent(-1)}
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={copy.next}
                  onClick={() => showRelativeEvent(1)}
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
              {selectedEvent && (
                <>
                  {selectedEvent.imageUrl && (
                    <div className="mb-6 w-full">
                      <img
                        src={selectedEvent.imageUrl}
                        alt={getEventName(selectedEvent)}
                        className="pointer-events-none h-auto w-full select-none rounded"
                        draggable="false"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  )}

                  <DrawerTitle className="mb-3 text-2xl font-bold">
                    {drawerLoading ? copy.loading : getEventName(selectedEvent)}
                  </DrawerTitle>

                  {drawerLoading && (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  )}

                  <DrawerDescription asChild>
                    {drawerLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-3/5" />
                      </div>
                    ) : (
                      <div className="space-y-2 text-base text-ink-2">
                        <div className="font-outlier text-sm capitalize text-muted-foreground">
                          {getDayLabel(selectedEvent.date)}, {selectedEvent.time}
                        </div>
                        <div>
                          <strong className="font-medium text-ink">{copy.category}:</strong>{" "}
                          {getEventCategory(selectedEvent)}
                        </div>
                        <div>
                          <strong className="font-medium text-ink">{copy.location}:</strong>{" "}
                          {getEventLocation(selectedEvent)}
                        </div>
                      </div>
                    )}
                  </DrawerDescription>
                </>
              )}
            </DrawerHeader>

            {selectedEvent && !drawerLoading && (
              <div className="mt-6 border-t border-rule pt-4">
                <MarkdownRenderer content={getEventDescription(selectedEvent)} />
              </div>
            )}

            {selectedEvent && !drawerLoading && (
              <div className="mt-6 space-y-6">
                {selectedEvent.sponsors && selectedEvent.sponsors.length > 0 && (
                  <div>
                    <h3 className="mb-3 border-t-2 border-ink pt-3 font-display text-lg font-bold">
                      {copy.sponsors}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {getSponsorsDetails(selectedEvent.sponsors).map((sponsor) => (
                        <div key={sponsor.id} className="flex items-center gap-2">
                          <img
                            src={sponsor.img_url}
                            alt={getSponsorName(sponsor)}
                            className="h-10 w-10 object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="text-base">{getSponsorName(sponsor)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.file_url && (
                  <Button asChild variant="outline" className="w-full">
                    <a
                      href={selectedEvent.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download aria-hidden="true" />
                      {copy.documents}
                    </a>
                  </Button>
                )}
              </div>
            )}

            <DrawerFooter className="mt-6 p-0">
              {selectedEvent && !isExpired(selectedEvent) ? (
                user ? (
                  hasSignedUp ? (
                    <div className="space-y-3">
                      <Button type="button" variant="secondary" className="w-full" disabled>
                        <Check aria-hidden="true" />
                        {copy.signedUp}
                      </Button>
                      {justSignedUp && (
                        <p role="status" className="text-sm text-ink-2">
                          {copy.ticketReady}{" "}
                          <Link
                            href="/profile"
                            className="font-medium text-brand underline underline-offset-4 decoration-1 hover:decoration-2"
                          >
                            {copy.viewTicket}
                          </Link>
                        </p>
                      )}
                    </div>
                  ) : missingDetails.length > 0 ? (
                    <div className="border-t border-rule pt-4">
                      <p className="font-display text-lg font-bold">{copy.completeTitle}</p>
                      <p className="mt-1 text-sm text-ink-2">{copy.completeBody}</p>
                      <div className="mt-4 flex flex-col gap-2">
                        {missingDetails.includes("name") && (
                          <Field id="event-signup-name" label={copy.fullName} error={detailErrors.name}>
                            <Input
                              value={details.name}
                              onChange={(event) => {
                                setDetails((prev) => ({ ...prev, name: event.target.value }));
                                setDetailErrors((prev) => ({ ...prev, name: undefined }));
                              }}
                              autoComplete="name"
                            />
                          </Field>
                        )}
                        <AcademicFields
                          faculty={details.faculty}
                          department={details.department}
                          errors={detailErrors}
                          onChange={({ faculty, department }) => {
                            setDetails((prev) => ({ ...prev, faculty, department }));
                            setDetailErrors((prev) => ({
                              ...prev,
                              faculty: undefined,
                              department: undefined,
                            }));
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        className="mt-2 w-full"
                        loading={signingUp}
                        onClick={handleSignup}
                      >
                        {copy.saveAndSignUp}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      loading={signingUp}
                      onClick={handleSignup}
                    >
                      {copy.signUp}
                    </Button>
                  )
                ) : (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() =>
                      router.push(
                        loginHref(`/events?event=${selectedEvent.docId ?? selectedEvent.id}`)
                      )
                    }
                  >
                    {copy.signInToSignUp}
                  </Button>
                )
              ) : (
                selectedEvent && (
                  <p className="flex items-center gap-2 border border-error px-4 py-3 text-sm font-medium text-error">
                    <Clock aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {copy.eventEnded}
                  </p>
                )
              )}
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="mt-3 w-full">
                  {copy.close}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={getLocaleCode(locale).startsWith("ar")}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </PageContainer>
  );
}

export default function EventsClient({
  initialEvents = [],
  initialSponsors = [],
  serverNow,
}) {
  // No Suspense around the page: only SearchParamsHandler reads the URL (in its own
  // boundary), so the event list stays in the server-rendered HTML.
  return (
    <EventsPageContent
      initialEvents={initialEvents}
      initialSponsors={initialSponsors}
      serverNow={serverNow}
    />
  );
}
