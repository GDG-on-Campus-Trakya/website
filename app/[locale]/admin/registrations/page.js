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
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section, EmptyState } from "@/components/ui/page";
import { useLocale } from "next-intl";
import { formatLocalizedDate, getLocalizedField } from "@/utils/localeUtils";
import { useConfirm } from "@/components/ConfirmProvider";
import { getEventStart } from "@/utils/eventTime";

export default function AdminRegistrationsPage() {
  const confirm = useConfirm();
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          loading: "Loading…",
          accessDenied: "Access denied",
          title: "Event registrations",
          subtitle: "View and manage all event registrations",
          manageTitle: "Manage event registrations",
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
          registrationDate: "Registration date",
          delete: "Delete",
        }
      : {
          loading: "Yükleniyor…",
          accessDenied: "Erişim engellendi",
          title: "Etkinlik kayıtları",
          subtitle: "Tüm etkinlik kayıtlarını görüntüleyin ve yönetin",
          manageTitle: "Etkinlik kayıtlarını yönet",
          noEvents: "Etkinlik bulunamadı.",
          confirmDelete:
            "Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
          deleteSuccess: "Kayıt başarıyla silindi.",
          deleteError:
            "Kayıt silinirken bir hata oluştu. Lütfen tekrar deneyin.",
          registration: "kayıt",
          registrations: "kayıt",
          noRegisteredUsers: "Bu etkinlik için kayıtlı kullanıcı bulunamadı.",
          unknownDate: "Bilinmeyen tarih",
          name: "Ad",
          email: "Email",
          userId: "Kullanıcı ID",
          registrationDate: "Kayıt tarihi",
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
        // Newest first, so the event being run today is at the top instead of in id order.
        const startOf = (event) => getEventStart(event)?.getTime() ?? 0;
        setEvents(
          eventsSnapshot.docs
            .map((doc) => ({
              firestoreId: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => startOf(b) - startOf(a))
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
    if (!(await confirm(copy.confirmDelete, { destructive: true }))) return;

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
    return <p className="py-12 text-ink-2">{copy.loading}</p>;
  }

  if (!isAdmin) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        {copy.accessDenied}
      </p>
    );
  }

  return (
    <div>
      <PageHeader title={copy.title} description={copy.subtitle} />

      <Section title={copy.manageTitle}>
        {events.length === 0 ? (
          <EmptyState title={copy.noEvents} />
        ) : (
          <ul className="border-t border-rule">
            {events.map((event) => {
              const registeredUsers = registrations
                .filter((reg) => reg.eventId === event.id)
                .sort((a, b) => (a.signedUpAt?.seconds ?? 0) - (b.signedUpAt?.seconds ?? 0));
              const registrationCount = registeredUsers.length;
              const isExpanded = !!expandedEvents[event.firestoreId];

              return (
                <li key={event.firestoreId} className="border-b border-rule">
                  <button
                    type="button"
                    onClick={() => toggleEventExpansion(event.firestoreId)}
                    aria-expanded={isExpanded}
                    className="flex min-h-12 w-full items-start justify-between gap-4 py-3 text-left transition-colors duration-micro hover:bg-secondary"
                  >
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <h3 className="w-full break-words text-base font-semibold">
                        {getLocalizedField(event, "name", locale)}
                      </h3>
                      <span className="mt-1 font-outlier text-sm tabular-nums text-muted-foreground">
                        {registrationCount}{" "}
                        {registrationCount === 1
                          ? copy.registration
                          : copy.registrations}
                      </span>
                    </div>
                    {isExpanded ? (
                      <Minus className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Plus className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pb-4 pl-0 sm:pl-6">
                      {registrationCount === 0 ? (
                        <p className="py-2 text-sm text-muted-foreground">
                          {copy.noRegisteredUsers}
                        </p>
                      ) : (
                        <ul className="border-t border-rule">
                          {registeredUsers.map((reg) => {
                            const userData = usersMap[reg.userId];
                            const signedUpDate = reg.signedUpAt
                              ? new Date(
                                  reg.signedUpAt.seconds * 1000
                                )
                              : null;

                            return (
                              <li
                                key={reg.firestoreId}
                                className="flex flex-col gap-3 border-b border-rule py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="break-words text-sm">
                                    {userData
                                      ? `${copy.name}: ${userData.name}`
                                      : `${copy.userId}: ${reg.userId}`}
                                  </p>
                                  <p className="break-all text-sm">
                                    {userData ? `${copy.email}: ${userData.email}` : ""}
                                  </p>
                                  <p className="font-outlier text-xs text-muted-foreground">
                                    {copy.registrationDate}:{" "}
                                    {signedUpDate
                                      ? formatDateTime(signedUpDate)
                                      : copy.unknownDate}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveRegistration(reg.firestoreId)
                                  }
                                >
                                  {copy.delete}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <ToastContainer theme="light" />
    </div>
  );
}
