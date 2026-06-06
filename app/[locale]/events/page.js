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
import { motion, AnimatePresence } from "framer-motion";
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
    signedUp: "✓ Kayıt Olundu",
    signUp: "Kayıt Ol",
    signInToSignUp: "Kayıt Olmak için Giriş Yapın",
    eventEnded: "⏱ Bu etkinlik sona erdi.",
    close: "Kapat",
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
    signedUp: "✓ Registered",
    signUp: "Register",
    signInToSignUp: "Sign in to register",
    eventEnded: "⏱ This event has ended.",
    close: "Close",
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0a0a19] to-black font-sans text-white">
      <div className="text-2xl">{copy.loading}</div>
    </div>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#0a0a19] to-black p-6 font-sans text-white"
    >
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-6 flex flex-col items-center"
      >
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-3 text-5xl font-bold"
        >
          {copy.title}
        </motion.h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg text-gray-400"
        >
          {copy.subtitle}
        </motion.div>
      </motion.header>

      <Suspense fallback={null}>
        <SearchParamsHandler
          onQRCodeRedirect={handleQRCodeRedirect}
          events={events}
        />
      </Suspense>

      <main className="flex w-full max-w-5xl flex-col justify-center gap-6 lg:flex-row">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="order-1 mx-auto flex w-full max-w-sm flex-col gap-4 lg:order-2 lg:sticky lg:top-5 lg:w-1/3"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {currentMonth && (
              <Calendar
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                handleDateClick={handleDateClick}
                eventDates={eventDates}
              />
            )}
          </motion.div>

          {!selectedDate && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all shadow-md ${
                  filterStatus === "upcoming"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30"
                    : "border border-gray-600/50 bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => {
                  setFilterStatus("upcoming");
                  setSelectedDate(null);
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  {copy.upcoming}
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all shadow-md ${
                  filterStatus === "past"
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-gray-500/30"
                    : "border border-gray-600/50 bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => {
                  setFilterStatus("past");
                  setSelectedDate(null);
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {copy.past}
                </div>
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="relative order-2 max-w-[900px] flex-1 lg:order-1"
        >
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute bottom-0 left-10 top-0 w-px bg-gray-600"
          />
          <div className="ml-14 flex flex-col gap-6">
            <AnimatePresence>
              {filteredEvents.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {filteredEvents.map((event, index) => {
                    const status = isExpired(event.date, event.time)
                      ? copy.past
                      : copy.upcoming;
                    const statusColor =
                      status === copy.upcoming ? "bg-green-600" : "bg-red-600";

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                        whileHover={{
                          scale: 1.01,
                          transition: { duration: 0.1 },
                        }}
                        className="relative flex cursor-pointer flex-col items-start rounded-xl border border-gray-700/50 bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm transition-all hover:bg-gray-700/50 hover:shadow-xl active:scale-95 sm:flex-row sm:p-5"
                        onClick={() => handleEventClick(event)}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: index * 0.1 + 0.3,
                            duration: 0.3,
                          }}
                          className="absolute left-[-60px] top-6 flex flex-col items-center"
                        >
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            className={`z-10 h-5 w-5 rounded-full shadow-lg ${statusColor}`}
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="mb-4 w-full sm:mb-0 sm:mr-6 sm:w-auto"
                        >
                          <div className="group relative overflow-hidden rounded-lg">
                            <img
                              src={event.imageUrl}
                              alt={getEventName(event)}
                              className="h-auto w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105 sm:w-52 md:w-56"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          </div>
                        </motion.div>

                        <div className="flex w-full flex-col">
                          <h4 className="text-base font-medium text-blue-400 sm:text-lg">
                            {getDayLabel(event.date)}
                          </h4>
                          <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl md:text-3xl">
                            {getEventName(event)}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-400 sm:text-base">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {event.time}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-400 sm:text-base">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {getEventLocation(event)}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-300 sm:text-sm">
                              {getEventCategory(event)}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium sm:text-sm ${
                                status === copy.upcoming
                                  ? "border-green-500/30 bg-green-500/20 text-green-300"
                                  : "border-red-500/30 bg-red-500/20 text-red-300"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="no-events"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6 text-center text-gray-400"
                >
                  <div className="mt-10 text-lg text-gray-400">{copy.noEvents}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent className="max-md:inset-x-0 max-md:bottom-0 max-md:h-[85vh] max-md:rounded-t-[10px] max-md:border-t md:bottom-0 md:left-auto md:right-0 md:top-0 md:h-screen md:w-[400px] md:rounded-none md:border-l border-gray-600 bg-[#0a0a19] text-white">
          <div className="h-full touch-pan-y overflow-y-auto overscroll-contain p-6 md:scrollbar-thin md:scrollbar-thumb-gray-600 md:scrollbar-track-transparent">
            <DrawerHeader className="p-0">
              <div className="mb-6 flex justify-end space-x-3">
                <button
                  className="h-10 w-10 rounded-full border border-gray-600/50 bg-gray-700/50 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-gray-600 active:scale-95"
                  onClick={() => showRelativeEvent(-1)}
                >
                  <svg
                    className="mx-auto h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  className="h-10 w-10 rounded-full border border-gray-600/50 bg-gray-700/50 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-gray-600 active:scale-95"
                  onClick={() => showRelativeEvent(1)}
                >
                  <svg
                    className="mx-auto h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              {selectedEvent && (
                <>
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

                  <DrawerTitle className="mb-3 text-3xl font-bold">
                    {drawerLoading ? copy.loading : getEventName(selectedEvent)}
                  </DrawerTitle>

                  {drawerLoading && (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 w-1/2 rounded bg-gray-700" />
                      <div className="h-4 w-2/3 rounded bg-gray-700" />
                    </div>
                  )}

                  <DrawerDescription asChild>
                    {drawerLoading ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 w-2/3 rounded bg-gray-700" />
                        <div className="h-4 w-1/2 rounded bg-gray-700" />
                        <div className="h-4 w-3/5 rounded bg-gray-700" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-lg text-gray-400">
                          {getDayLabel(selectedEvent.date)}, {selectedEvent.time}
                        </div>
                        <div className="text-lg text-gray-400">
                          <strong>{copy.category}:</strong>{" "}
                          {getEventCategory(selectedEvent)}
                        </div>
                        <div className="text-lg text-gray-400">
                          <strong>{copy.location}:</strong>{" "}
                          {getEventLocation(selectedEvent)}
                        </div>
                      </div>
                    )}
                  </DrawerDescription>
                </>
              )}
            </DrawerHeader>

            {selectedEvent && !drawerLoading && (
              <div className="space-y-6 px-6">
                <div className="border-t border-gray-700/50 pt-4">
                  <div className="prose prose-invert prose-sm max-w-none [&>*]:mb-3 [&>a]:text-blue-400 [&>a]:hover:text-blue-300 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:text-gray-300 [&>code]:rounded [&>code]:bg-gray-800/60 [&>code]:px-1.5 [&>code]:py-0.5 [&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg [&>ol]:list-decimal [&>ol]:pl-5 [&>ul]:list-disc [&>ul]:pl-5">
                    <MarkdownRenderer content={getEventDescription(selectedEvent)} />
                  </div>
                </div>
              </div>
            )}

            {selectedEvent && !drawerLoading && (
              <div className="space-y-6 px-6">
                {selectedEvent.sponsors && selectedEvent.sponsors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-2xl font-semibold">{copy.sponsors}</h3>
                    <div className="flex flex-wrap gap-4">
                      {getSponsorsDetails(selectedEvent.sponsors).map((sponsor) => (
                        <div key={sponsor.id} className="flex items-center space-x-2">
                          <img
                            src={sponsor.img_url}
                            alt={getSponsorName(sponsor)}
                            className="h-10 w-10 object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="text-lg">{getSponsorName(sponsor)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.file_url && (
                  <div className="mb-6">
                    <a
                      href={selectedEvent.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-blue-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {copy.documents}
                    </a>
                  </div>
                )}
              </div>
            )}

            <DrawerFooter className="mt-6 p-0">
              {selectedEvent && !isExpired(selectedEvent.date, selectedEvent.time) ? (
                user ? (
                  hasSignedUp ? (
                    <button
                      className="w-full cursor-not-allowed rounded-xl border border-gray-600/50 bg-gray-600/50 py-3.5 font-semibold text-gray-300"
                      disabled
                    >
                      {copy.signedUp}
                    </button>
                  ) : (
                    <button
                      className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-3.5 font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:from-green-600 hover:to-green-700"
                      onClick={handleSignup}
                    >
                      {copy.signUp}
                    </button>
                  )
                ) : (
                  <button
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-blue-700"
                    onClick={() => router.push("/login")}
                  >
                    {copy.signInToSignUp}
                  </button>
                )
              ) : (
                selectedEvent && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-400">
                    {copy.eventEnded}
                  </div>
                )
              )}
              <DrawerClose asChild>
                <button className="mt-3 w-full rounded-xl border border-gray-600/50 bg-gray-700/50 py-3.5 font-semibold text-white transition-all hover:bg-gray-600">
                  {copy.close}
                </button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-2xl text-white">{copy.loading}</div>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-700 bg-opacity-80">
          <div className="text-2xl text-white">
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
        theme="dark"
      />
    </motion.div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsPageFallback />}>
      <EventsPageContent />
    </Suspense>
  );
}
