"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Stat } from "@/components/ui/stat";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useLocale } from "next-intl";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    statsLoading: "İstatistikler yükleniyor...",
    pageTitle: "Etkinlik İstatistikleri",
    pageSubtitle: "Tüm etkinlik verilerini analiz edin",
    totalRegistrations: "Toplam Kayıt",
    totalAttendance: "Toplam Katılım",
    averageAttendance: "Ortalama Katılım",
    tabActiveEvents: (n) => `Aktif Etkinlikler (${n})`,
    tabArchive: (n) => `Arşiv (${n})`,
    emptyCurrent: "Henüz aktif etkinlik bulunmuyor",
    emptyArchive: "Arşivlenmiş etkinlik bulunmuyor",
    dateLabel: "Tarih:",
    timeLabel: "Saat:",
    attended: "Katılım Sağlayan",
    attendanceRate: "Katılım Oranı",
    colParticipant: "Katılımcı",
    colEmail: "Email",
    colStatus: "Durum",
    colSignupDate: "Kayıt Tarihi",
    colAttendanceDate: "Katılım Tarihi",
    colVerifiedBy: "Onaylayan",
    statusJoined: "Katıldı",
    statusNotJoined: "Katılmadı",
    statusRegistered: "Kayıtlı",
    locale: "tr-TR",
  },
  en: {
    statsLoading: "Loading statistics...",
    pageTitle: "Event Statistics",
    pageSubtitle: "Analyze all event data",
    totalRegistrations: "Total Registrations",
    totalAttendance: "Total Attendance",
    averageAttendance: "Average Attendance",
    tabActiveEvents: (n) => `Active Events (${n})`,
    tabArchive: (n) => `Archive (${n})`,
    emptyCurrent: "No active events yet",
    emptyArchive: "No archived events",
    dateLabel: "Date:",
    timeLabel: "Time:",
    attended: "Attended",
    attendanceRate: "Attendance Rate",
    colParticipant: "Participant",
    colEmail: "Email",
    colStatus: "Status",
    colSignupDate: "Registration Date",
    colAttendanceDate: "Attendance Date",
    colVerifiedBy: "Verified By",
    statusJoined: "Attended",
    statusNotJoined: "Did Not Attend",
    statusRegistered: "Registered",
    locale: "en-US",
  },
};

export default function AdminEventStatsPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [eventStats, setEventStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'archive'
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  // Check if user is admin
  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setIsAdmin(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        logger.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  // Fetch event statistics
  useEffect(() => {
    const fetchEventStats = async () => {
      if (!isAdmin) return;

      try {
        setIsLoading(true);

        // Fetch all events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const events = eventsSnapshot.docs.map((doc) => ({
          id: doc.data().id,
          firestoreId: doc.id,
          ...doc.data(),
        }));

        // Fetch all registrations
        const registrationsSnapshot = await getDocs(
          collection(db, "registrations")
        );
        const registrations = registrationsSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));

        // Calculate stats for each event
        const stats = await Promise.all(
          events.map(async (event) => {
            const eventRegistrations = registrations.filter(
              (reg) => reg.eventId === event.id
            );
            const verifiedAttendees = eventRegistrations.filter(
              (reg) => reg.didJoinEvent
            );

            // Get user details for all registrants
            const userIds = [
              ...new Set(eventRegistrations.map((reg) => reg.userId)),
            ];
            const usersData = {};

            if (userIds.length > 0) {
              const batchSize = 10;
              for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const usersQuery = query(
                  collection(db, "users"),
                  where("__name__", "in", batch)
                );
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach((doc) => {
                  usersData[doc.id] = { id: doc.id, ...doc.data() };
                });
              }
            }

            // Combine registration data with user data
            const registrantsDetails = eventRegistrations.map((reg) => ({
              ...reg,
              user: usersData[reg.userId] || {
                id: reg.userId,
                name: "Unknown",
                email: "Unknown",
              },
            }));

            return {
              ...event,
              totalRegistrations: eventRegistrations.length,
              verifiedAttendees: verifiedAttendees.length,
              attendanceRate:
                eventRegistrations.length > 0
                  ? (
                      (verifiedAttendees.length / eventRegistrations.length) *
                      100
                    ).toFixed(1)
                  : 0,
              registrants: registrantsDetails,
            };
          })
        );

        // Separate current and archived events
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const statsWithCategory = stats.map(event => ({
          ...event,
          isArchived: new Date(event.date) < oneMonthAgo
        }));
        
        setEventStats(statsWithCategory);
        setIsLoading(false);
      } catch (error) {
        logger.error("Error fetching event stats:", error);
        setIsLoading(false);
      }
    };

    fetchEventStats();
  }, [isAdmin]);

  const toggleEvent = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;
    
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAdmin]);
  
  // Refresh data when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      fetchEventStats();
    }
  }, [refreshKey]);
  
  const fetchEventStats = async () => {
    if (!isAdmin) return;

    try {
      setIsLoading(true);

      // Fetch all events
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const events = eventsSnapshot.docs.map((doc) => ({
        id: doc.data().id,
        firestoreId: doc.id,
        ...doc.data(),
      }));

      // Fetch all registrations
      const registrationsSnapshot = await getDocs(
        collection(db, "registrations")
      );
      const registrations = registrationsSnapshot.docs.map((doc) => ({
        firestoreId: doc.id,
        ...doc.data(),
      }));

      // Calculate stats for each event
      const stats = await Promise.all(
        events.map(async (event) => {
          const eventRegistrations = registrations.filter(
            (reg) => reg.eventId === event.id
          );
          const verifiedAttendees = eventRegistrations.filter(
            (reg) => reg.didJoinEvent
          );

          // Get user details for all registrants
          const userIds = [
            ...new Set(eventRegistrations.map((reg) => reg.userId)),
          ];
          const usersData = {};

          if (userIds.length > 0) {
            const batchSize = 10;
            for (let i = 0; i < userIds.length; i += batchSize) {
              const batch = userIds.slice(i, i + batchSize);
              const usersQuery = query(
                collection(db, "users"),
                where("__name__", "in", batch)
              );
              const usersSnapshot = await getDocs(usersQuery);
              usersSnapshot.forEach((doc) => {
                usersData[doc.id] = { id: doc.id, ...doc.data() };
              });
            }
          }

          // Combine registration data with user data
          const registrantsDetails = eventRegistrations.map((reg) => ({
            ...reg,
            user: usersData[reg.userId] || {
              id: reg.userId,
              name: "Unknown",
              email: "Unknown",
            },
          }));

          return {
            ...event,
            totalRegistrations: eventRegistrations.length,
            verifiedAttendees: verifiedAttendees.length,
            attendanceRate:
              eventRegistrations.length > 0
                ? (
                    (verifiedAttendees.length / eventRegistrations.length) *
                    100
                  ).toFixed(1)
                : 0,
            registrants: registrantsDetails,
          };
        })
      );

      // Separate current and archived events
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const statsWithCategory = stats.map(event => ({
        ...event,
        isArchived: new Date(event.date) < oneMonthAgo
      }));
      
      setEventStats(statsWithCategory);
      setIsLoading(false);
    } catch (error) {
      logger.error("Error fetching event stats:", error);
      setIsLoading(false);
    }
  };
  
  if (loading || isLoading) {
    return (
      <p role="status" className="py-12 text-ink-2">
        {copy.statsLoading}
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        {a.accessDenied}
      </p>
    );
  }

  const filteredEvents = eventStats.filter(event =>
    activeTab === 'current' ? !event.isArchived : event.isArchived
  );

  const currentEvents = eventStats.filter(event => !event.isArchived);
  const archivedEvents = eventStats.filter(event => event.isArchived);

  const totalRegistrations = currentEvents.reduce((sum, event) => sum + event.totalRegistrations, 0);
  const totalAttendees = currentEvents.reduce((sum, event) => sum + event.verifiedAttendees, 0);
  const averageAttendance = currentEvents.length > 0
    ? (totalAttendees / totalRegistrations * 100).toFixed(1)
    : 0;

  const tabClass = (isActive) =>
    cn(
      "-mb-px min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors duration-micro",
      isActive
        ? "border-brand text-ink"
        : "border-transparent text-muted-foreground hover:text-ink"
    );

  return (
    <div>
      <PageHeader
        title={copy.pageTitle}
        description={copy.pageSubtitle}
      />

      {/* Overall stats */}
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Stat label={copy.totalRegistrations} value={totalRegistrations} />
        <Stat label={copy.totalAttendance} value={totalAttendees} />
        <Stat label={copy.averageAttendance} value={`${averageAttendance}%`} />
      </dl>

      {/* Tabs */}
      <div className="mt-10 flex border-b border-rule md:mt-14">
        <button
          type="button"
          onClick={() => setActiveTab('current')}
          aria-pressed={activeTab === 'current'}
          className={tabClass(activeTab === 'current')}
        >
          {copy.tabActiveEvents(currentEvents.length)}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          aria-pressed={activeTab === 'archive'}
          className={tabClass(activeTab === 'archive')}
        >
          {copy.tabArchive(archivedEvents.length)}
        </button>
      </div>

      <div>
        {filteredEvents.length === 0 ? (
          <EmptyState
            className="border-t-0"
            title={activeTab === 'current' ? copy.emptyCurrent : copy.emptyArchive}
          />
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="border-b border-rule"
            >
            <button
              type="button"
              onClick={() => toggleEvent(event.id)}
              aria-expanded={!!expandedEvents[event.id]}
              className="flex min-h-14 w-full items-start justify-between gap-4 py-4 text-left transition-colors duration-micro hover:bg-secondary"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="min-w-0 break-words font-display text-lg font-bold">
                  {event.name}
                </span>
                <div className="text-sm text-ink-2">
                  <span className="font-medium">{copy.dateLabel}</span>{" "}
                  <span className="font-outlier">
                    {new Date(event.date).toLocaleDateString(copy.locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {event.time && (
                    <span className="ml-2">
                      <span className="font-medium">{copy.timeLabel}</span>{" "}
                      <span className="font-outlier">{event.time}</span>
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-short ease-out",
                  expandedEvents[event.id] && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            {expandedEvents[event.id] && (
              <div className="pb-6">
                <dl className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <Stat label={copy.totalRegistrations} value={event.totalRegistrations} />
                  <Stat label={copy.attended} value={event.verifiedAttendees} />
                  <Stat label={copy.attendanceRate} value={`${event.attendanceRate}%`} />
                </dl>

                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{copy.colParticipant}</TableHead>
                      <TableHead>{copy.colEmail}</TableHead>
                      <TableHead>{copy.colStatus}</TableHead>
                      <TableHead>{copy.colSignupDate}</TableHead>
                      <TableHead>{copy.colAttendanceDate}</TableHead>
                      <TableHead>{copy.colVerifiedBy}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.registrants.map((registrant) => (
                      <TableRow key={registrant.firestoreId}>
                        <TableCell className="whitespace-nowrap font-medium">
                          {registrant.user.name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-ink-2">
                          {registrant.user.email}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              registrant.didJoinEvent
                                ? "success"
                                : new Date(event.date) < new Date()
                                ? "error"
                                : "neutral"
                            }
                          >
                            {registrant.didJoinEvent
                              ? copy.statusJoined
                              : new Date(event.date) < new Date()
                              ? copy.statusNotJoined
                              : copy.statusRegistered}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-outlier tabular-nums text-ink-2">
                          {new Date(
                            registrant.signedUpAt?.seconds * 1000
                          ).toLocaleString(copy.locale)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-outlier tabular-nums text-ink-2">
                          {registrant.didJoinEvent
                            ? new Date(
                                registrant.verifiedAt?.seconds * 1000
                              ).toLocaleString(copy.locale)
                            : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-ink-2">
                          {registrant.didJoinEvent
                            ? registrant.verifiedBy || "-"
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
