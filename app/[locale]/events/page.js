"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { logger } from "@/utils/logger";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageContainer, PageHeader, Skeleton } from "@/components/ui/page";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  formatLocalizedDate,
  getLocalizedField,
  getLocaleCode,
} from "@/utils/localeUtils";

const COPY = {
  tr: {
    title: "Etkinlikler",
    subtitle: "Katılmak istediğiniz etkinlikleri keşfedin ve kaydolun!",
    upcoming: "Yaklaşan",
    past: "Geçmiş",
    today: "Bugün",
    tomorrow: "Yarın",
    noEvents: "Yaklaşan bir etkinlik yok. Takipte kalın!",
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
    loginRequired: "Kayıt olmak için giriş yapmalısınız.",
    profileMissing: "Profil bilgileriniz bulunamadı.",
    profileIncomplete:
      "Etkinliğe kayıt olabilmek için profil bilgilerinizi tamamlamanız gerekmektedir.",
    alreadySignedUp: "Bu etkinliğe zaten kayıt oldunuz.",
    signupSuccess: "Etkinliğe başarıyla kayıt oldunuz!",
    signupError: "Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.",
    qrEventMissing: "QR kod için etkinlik bulunamadı.",
    invalidQr: "Geçersiz QR kod.",
    qrError: "QR kod işlenirken bir hata oluştu.",
    sponsorFallback: "Sponsor",
  },
  en: {
    title: "Events",
    subtitle: "Discover the events you want to join and register easily.",
    upcoming: "Upcoming",
    past: "Past",
    today: "Today",
    tomorrow: "Tomorrow",
    noEvents: "There are no upcoming events right now. Check back soon.",
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
    loginRequired: "You need to sign in before registering.",
    profileMissing: "Your profile information could not be found.",
    profileIncomplete:
      "You need to complete your profile information before registering for an event.",
    alreadySignedUp: "You are already registered for this event.",
    signupSuccess: "You have registered for the event successfully!",
    signupError: "An error occurred while registering. Please try again.",
    qrEventMissing: "No event was found for this QR code.",
    invalidQr: "Invalid QR code.",
    qrError: "An error occurred while processing the QR code.",
    sponsorFallback: "Sponsor",
  },
};

function SearchParamsHandler({ onQRCodeRedirect, events }) {
  const searchParams = useSearchParams();
  const processedQRCodes = useRef(new Set());

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

function EventsPageFallback() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  return (
    <PageContainer>
      <p className="text-lg text-muted-foreground">{copy.loading}</p>
    </PageContainer>
  );
}

function EventsPageContent() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [filterStatus, setFilterStatus] = useState("upcoming");
  const [user, loading, error] = useAuthState(auth);
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

      const img = new Image();
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

  const isExpired = (eventDate, eventTime) => {
    if (!isClient) return false;
    const now = new Date();
    const [hours, minutes] = eventTime.split(":").map(Number);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);
    return now > eventDateTime;
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

  const handleSignup = async () => {
    if (!user) {
      toast.error(copy.loginRequired);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        toast.error(copy.profileMissing);
        router.push("/profile");
        return;
      }

      const userData = userDoc.data();
      if (!userData.name || !userData.faculty || !userData.department) {
        toast.error(copy.profileIncomplete);
        router.push("/profile");
        return;
      }

      const registrationsRef = collection(db, "registrations");
      const signupQuery = query(
        registrationsRef,
        where("eventId", "==", selectedEvent.id),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(signupQuery);

      if (!querySnapshot.empty) {
        toast.info(copy.alreadySignedUp);
        setHasSignedUp(true);
        return;
      }

      const newRegistration = await addDoc(registrationsRef, {
        eventId: selectedEvent.id,
        userId: user.uid,
        signedUpAt: new Date(),
        didJoinEvent: false,
      });

      const qrCodeRef = collection(db, "qrCodes");
      const newQrCode = await addDoc(qrCodeRef, {
        registrationId: newRegistration.id,
        createdAt: new Date(),
      });

      const qrCodeData = `qrCode=${newQrCode.id}`;

      await updateDoc(doc(qrCodeRef, newQrCode.id), {
        code: qrCodeData,
      });

      await updateDoc(doc(registrationsRef, newRegistration.id), {
        qrCodeId: newQrCode.id,
      });

      toast.success(copy.signupSuccess);
      setHasSignedUp(true);
    } catch (signupError) {
      logger.error("Error signing up for event:", signupError);
      toast.error(copy.signupError);
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
  }, []);

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
      if (isClient) {
        const now = new Date();
        filtered = filtered.filter((event) => {
          const [hours, minutes] = event.time.split(":").map(Number);
          const eventDateTime = new Date(event.date);
          eventDateTime.setHours(hours, minutes, 0, 0);
          return eventDateTime >= now;
        });
      }

      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (filterStatus === "past") {
      if (!isClient) {
        filtered = [];
      } else {
        const now = new Date();
        filtered = filtered.filter((event) => {
          const [hours, minutes] = event.time.split(":").map(Number);
          const eventDateTime = new Date(event.date);
          eventDateTime.setHours(hours, minutes, 0, 0);
          return eventDateTime < now;
        });
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    }

    return filtered;
  }, [events, selectedDate, filterStatus, isClient]);

  const getSponsorsDetails = (sponsorIds) =>
    sponsors.filter((sponsor) => sponsorIds.includes(sponsor.id));

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.subtitle} />

      <Suspense fallback={null}>
        <SearchParamsHandler
          onQRCodeRedirect={handleQRCodeRedirect}
          events={events}
        />
      </Suspense>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <aside className="min-w-0 lg:order-2 lg:sticky lg:top-6 lg:col-span-4 lg:self-start">
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

        <section className="min-w-0 lg:order-1 lg:col-span-8">
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

          {filteredEvents.length > 0 ? (
            <ul>
              {filteredEvents.map((event) => {
                const expired = isExpired(event.date, event.time);

                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      className="group grid w-full gap-x-6 gap-y-3 border-b border-rule py-5 text-left transition-colors duration-micro ease-out hover:bg-paper-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[minmax(0,1fr)_10rem]"
                      onClick={() => handleEventClick(event)}
                    >
                      {event.imageUrl && (
                        <span className="block aspect-[16/9] overflow-hidden rounded bg-paper-2 sm:order-2 sm:aspect-[4/3]">
                          <img
                            src={event.imageUrl}
                            alt={getEventName(event)}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
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
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title={copy.noEvents} className="mt-6" />
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
              {selectedEvent && !isExpired(selectedEvent.date, selectedEvent.time) ? (
                user ? (
                  hasSignedUp ? (
                    <Button type="button" variant="secondary" className="w-full" disabled>
                      <Check aria-hidden="true" />
                      {copy.signedUp}
                    </Button>
                  ) : (
                    <Button type="button" className="w-full" onClick={handleSignup}>
                      {copy.signUp}
                    </Button>
                  )
                ) : (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => router.push("/login")}
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

      {loading && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60">
          <div className="rounded-lg border border-rule bg-background px-6 py-4 text-lg text-foreground">
            {copy.loading}
          </div>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-ink/60">
          <div className="rounded-lg border border-error bg-background px-6 py-4 text-lg text-error">
            {copy.error}: {error.message}
          </div>
        </div>
      )}

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

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsPageFallback />}>
      <EventsPageContent />
    </Suspense>
  );
}
