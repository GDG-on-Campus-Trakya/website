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
import { Link } from "@/i18n/navigation";

export default function AdminEventStatsPage() {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-200">İstatistikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-lg text-red-400 font-semibold">Erişim Reddedildi</p>
        </div>
      </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      {/* Back to Admin Panel Button */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-3 text-sm sm:text-base bg-gray-800/70 backdrop-blur-lg text-gray-200 rounded-2xl hover:bg-gray-700/90 transition-all duration-300 border border-gray-700/50 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Admin Paneline Geri Dön
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Etkinlik İstatistikleri
          </h1>
          <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"></div>
        </div>
        <p className="text-gray-300 mt-4 text-lg">Tüm etkinlik verilerini analiz edin</p>
      </div>
      
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Toplam Kayıt</p>
              <p className="text-3xl font-bold text-blue-400">{totalRegistrations}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Toplam Katılım</p>
              <p className="text-3xl font-bold text-green-400">{totalAttendees}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Ortalama Katılım</p>
              <p className="text-3xl font-bold text-purple-400">{averageAttendance}%</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-2 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'current'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Aktif Etkinlikler ({currentEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'archive'
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg transform scale-105'
                : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Arşiv ({archivedEvents.length})
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-lg text-gray-400 mb-2">
              {activeTab === 'current' ? 'Henüz aktif etkinlik bulunmuyor' : 'Arşivlenmiş etkinlik bulunmuyor'}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-700/50"
            >
            <button
              onClick={() => toggleEvent(event.id)}
              className="w-full p-6 text-left border-b border-gray-600/30 hover:bg-gray-700/50 transition-all duration-300 focus:outline-none"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xl sm:text-2xl font-semibold text-gray-100">
                    {event.name}
                  </span>
                  <span
                    className="text-2xl transform transition-transform duration-200"
                    style={{
                      transform: expandedEvents[event.id]
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </div>
                <div className="mt-2 sm:mt-0 text-sm sm:text-base text-gray-300">
                  <span className="font-medium">Tarih:</span>{" "}
                  {new Date(event.date).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {event.time && (
                    <span className="ml-2">
                      <span className="font-medium">Saat:</span> {event.time}
                    </span>
                  )}
                </div>
              </div>
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedEvents[event.id]
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 p-6 rounded-2xl border border-blue-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-300 mb-1 font-medium">Toplam Kayıt</p>
                        <p className="text-3xl font-bold text-blue-400">
                          {event.totalRegistrations}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-700/50 rounded-xl">
                        <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 p-6 rounded-2xl border border-green-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-300 mb-1 font-medium">
                          Katılım Sağlayan
                        </p>
                        <p className="text-3xl font-bold text-green-400">
                          {event.verifiedAttendees}
                        </p>
                      </div>
                      <div className="p-2 bg-green-700/50 rounded-xl">
                        <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 p-6 rounded-2xl border border-purple-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-300 mb-1 font-medium">
                          Katılım Oranı
                        </p>
                        <p className="text-3xl font-bold text-purple-400">
                          {event.attendanceRate}%
                        </p>
                      </div>
                      <div className="p-2 bg-purple-200 rounded-xl">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-2xl overflow-hidden border border-gray-600">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gradient-to-r from-gray-800 to-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Katılımcı
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Kayıt Tarihi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Katılım Tarihi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Onaylayan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                      {event.registrants.map((registrant) => (
                        <tr key={registrant.firestoreId} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-100">
                              {registrant.user.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-400">
                              {registrant.user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                registrant.didJoinEvent
                                  ? "bg-green-900/50 text-green-300 border border-green-700"
                                  : new Date(event.date) < new Date()
                                  ? "bg-red-900/50 text-red-300 border border-red-700"
                                  : "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                              }`}
                            >
                              {registrant.didJoinEvent
                                ? "Katıldı"
                                : new Date(event.date) < new Date()
                                ? "Katılmadı"
                                : "Kayıtlı"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                            {new Date(
                              registrant.signedUpAt?.seconds * 1000
                            ).toLocaleString("tr-TR")}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                            {registrant.didJoinEvent
                              ? new Date(
                                  registrant.verifiedAt?.seconds * 1000
                                ).toLocaleString("tr-TR")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                            {registrant.didJoinEvent
                              ? registrant.verifiedBy || "-"
                              : "-"}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
