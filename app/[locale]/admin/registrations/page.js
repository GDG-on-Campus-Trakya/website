"use client";
// admin/registrations/page.js
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";

export default function AdminRegistrationsPage() {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          loading: "Loading...",
          accessDenied: "Access denied",
          backToAdmin: "Back to Admin Panel",
          title: "Event Registrations",
          subtitle: "View and manage all event registrations",
          manageTitle: "Manage Event Registrations",
          noEvents: "No events found.",
          confirmDelete:
            "Are you sure you want to delete this registration? This action cannot be undone.",
          deleteSuccess: "Registration deleted successfully.",
          deleteError:
            "An error occurred while deleting the registration. Please try again.",
          registration: "registration",
          registrations: "registrations",
          noRegisteredUsers: "No registered users were found for this event.",
          unknownDate: "Unknown date",
          name: "Name",
          email: "Email",
          userId: "User ID",
          registrationDate: "Registration Date",
          delete: "Delete",
        }
      : {
          loading: "Yükleniyor...",
          accessDenied: "Erişim engellendi",
          backToAdmin: "Admin Paneline Geri Dön",
          title: "Etkinlik Kayıtları",
          subtitle: "Tüm etkinlik kayıtlarını görüntüleyin ve yönetin",
          manageTitle: "Etkinlik Kayıtlarını Yönet",
          noEvents: "Etkinlik bulunamadı.",
          confirmDelete:
            "Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
          deleteSuccess: "Kayıt başarıyla silindi.",
          deleteError:
            "Kayıt silinirken bir hata oluştu. Lütfen tekrar deneyin.",
          registration: "kayıt",
          registrations: "kayıt",
          noRegisteredUsers: "Bu etkinlik için kayıtlı kullanıcı bulunamadı.",
          unknownDate: "Bilinmeyen Tarih",
          name: "Ad",
          email: "Email",
          userId: "Kullanıcı ID",
          registrationDate: "Kayıt Tarihi",
          delete: "Sil",
        };
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // data
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [expandedEvents, setExpandedEvents] = useState({});

  const router = useRouter();
  const formatDateTime = (date) =>
    formatLocalizedDate(date, locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // check user admin
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

  // fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        setEvents(
          eventsSnapshot.docs.map((doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
          }))
        );

        const registrationsSnapshot = await getDocs(
          collection(db, "registrations")
        );
        const registrationsData = registrationsSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));
        setRegistrations(registrationsData);

        const userIds = registrationsData.map((reg) => reg.userId);
        const uniqueUserIds = [...new Set(userIds)];

        if (uniqueUserIds.length > 0) {
          const usersCollectionRef = collection(db, "users");
          let usersData = {};

          const batchSize = 10;
          for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
            const batch = uniqueUserIds.slice(i, i + batchSize);
            const usersQuery = query(
              usersCollectionRef,
              where("__name__", "in", batch)
            );
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach((doc) => {
              usersData[doc.id] = { ...doc.data() };
            });
          }

          setUsersMap(usersData);
        }
      } catch (error) {
        logger.error("Error fetching data:", error);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // rm a registration
  const handleRemoveRegistration = async (registrationId) => {
    if (!confirm(copy.confirmDelete)) return;

    try {
      await deleteDoc(doc(db, "registrations", registrationId));
      setRegistrations((prev) =>
        prev.filter(
          (registration) => registration.firestoreId !== registrationId
        )
      );
      toast.success(copy.deleteSuccess);
    } catch (error) {
      logger.error("Error removing registration:", error);
      toast.error(copy.deleteError);
    }
  };

  // Add this function to toggle event expansion
  const toggleEventExpansion = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-200">{copy.loading}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">{copy.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      {/* Back to Admin Panel Button */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-3 text-sm sm:text-base bg-gray-800/70 backdrop-blur-lg text-gray-200 rounded-2xl hover:bg-gray-700/90 transition-all duration-300 border border-gray-700/50 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg
            className="w-4 h-4 mr-2"
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
          {copy.backToAdmin}
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            {copy.title}
          </h1>
          <div className="h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 rounded-full"></div>
        </div>
        <p className="text-gray-300 mt-4 text-lg">
          {copy.subtitle}
        </p>
      </div>

      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mr-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            {copy.manageTitle}
          </h2>
        </div>
        {events.length === 0 ? (
          <p className="text-gray-400">{copy.noEvents}</p>
        ) : (
          <ul className="space-y-4 sm:space-y-6">
            {events.map((event) => {
              const registeredUsers = registrations.filter(
                (reg) => reg.eventId === event.id
              );
              const registrationCount = registeredUsers.length;

              return (
                <li
                  key={event.firestoreId}
                  className="bg-gray-800/70 backdrop-blur-lg rounded-md shadow-sm overflow-hidden border border-gray-700/50"
                >
                  <button
                    onClick={() => toggleEventExpansion(event.firestoreId)}
                    className="w-full p-3 sm:p-4 flex justify-between items-start gap-4 hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-100 break-words w-full">
                        {getLocalizedField(event, "name", locale)}
                      </h3>
                      <span className="text-sm text-gray-400 mt-1">
                        {registrationCount}{" "}
                        {registrationCount === 1
                          ? copy.registration
                          : copy.registrations}
                      </span>
                    </div>
                    <span className="text-xl font-medium text-gray-400 w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {expandedEvents[event.firestoreId] ? "−" : "+"}
                    </span>
                  </button>

                  {expandedEvents[event.firestoreId] && (
                    <div className="border-t border-gray-600 p-3 sm:p-4">
                      <ul className="space-y-2 sm:space-y-3">
                        {registrationCount === 0 ? (
                          <p className="text-sm sm:text-base text-gray-400">
                            {copy.noRegisteredUsers}
                          </p>
                        ) : (
                          registeredUsers.map((reg) => {
                            const userData = usersMap[reg.userId];
                            const signedUpDate = reg.signedUpAt
                              ? new Date(
                                  reg.signedUpAt.seconds * 1000
                                )
                              : null;

                            return (
                              <li
                                key={reg.firestoreId}
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700/60 backdrop-blur-sm p-3 rounded-md gap-3 sm:gap-0 border border-gray-600/30 hover:bg-gray-700/80 transition-all duration-300"
                              >
                                <div className="w-full sm:w-auto">
                                  <p className="text-sm sm:text-base text-gray-200">
                                    {userData
                                      ? `${copy.name}: ${userData.name}`
                                      : `${copy.userId}: ${reg.userId}`}
                                  </p>
                                  <p className="text-sm sm:text-base text-gray-200">
                                    {userData ? `${copy.email}: ${userData.email}` : ""}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-400">
                                    {copy.registrationDate}:{" "}
                                    {signedUpDate
                                      ? formatDateTime(signedUpDate)
                                      : copy.unknownDate}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemoveRegistration(reg.firestoreId)
                                  }
                                  className="w-full sm:w-auto bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm"
                                >
                                  {copy.delete}
                                </button>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ToastContainer />
    </div>
  );
}
