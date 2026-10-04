"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { Link, useRouter } from "@/i18n/navigation";
import { loginHref } from "@/utils/redirect";
import UserInfo from "@/components/UserInfo";
import EventList from "@/components/EventList";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRCode from "qrcode";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, PageContainer, PageHeader, Section, Skeleton } from "@/components/ui/page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import TermsConsentModal from "@/components/TermsConsentModal";
import { Trash2 } from "lucide-react";
import { signOut } from "firebase/auth";

const COPY = {
  tr: {
    profileLoadError: "Profil verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.",
    registrationMissing: "Kayıt bulunamadı.",
    registrationDeleteError:
      "Kayıt silinirken bir hata oluştu. Lütfen tekrar deneyin.",
    emailPrefSaved: "E-posta tercihi başarıyla güncellendi.",
    emailPrefError: "E-posta tercihi güncellenemedi.",
    registrationDeleted: "Etkinlik kaydı silindi",
    genericError: "Bir hata oluştu",
    termsAccepted: "Şartlar kabul edildi. Hoş geldiniz!",
    termsAcceptError: "Bir hata oluştu. Lütfen tekrar deneyin.",
    signedOut: "Çıkış yapıldı.",
    signOutError: "Çıkış yapılırken bir hata oluştu.",
    loading: "Yükleniyor...",
    error: "Hata",
    title: "Profiliniz",
    emailPreferences: "Email Tercihleri",
    emailNotifications: "Email Bildirimleri",
    emailNotificationsHelp: "Etkinlikler ve güncellemeler hakkında email alın",
    language: "Dil",
    languageLabel: "Dil",
    languageHelp: "Siteyi görüntülemek istediğiniz dili seçin",
    updating: "Güncelleniyor...",
    registeredEvents: "Kayıt Olunmuş Etkinlikler",
    noEventsTitle: "Henüz kayıtlı etkinliğiniz yok",
    noEventsBody: "Bir etkinliğe kayıt olduğunuzda QR biletiniz burada görünür.",
    browseEvents: "Etkinliklere göz atın",
    accountSettings: "Hesap Ayarları",
    deleteAccount: "Hesabı Sil",
    deleteAccountBody:
      "Hesabınızı ve tüm verilerinizi kalıcı olarak silin. Bu işlem geri alınamaz.",
    confirmTitle: "Emin misiniz?",
    confirmBody: "Etkinlik kaydınızı silmek istediğinize emin misiniz?",
    cancel: "İptal",
    delete: "Sil",
  },
  en: {
    profileLoadError: "Profile data could not be loaded. Please try again later.",
    registrationMissing: "Registration not found.",
    registrationDeleteError:
      "An error occurred while deleting the registration. Please try again.",
    emailPrefSaved: "Email preference updated successfully.",
    emailPrefError: "Email preference could not be updated.",
    registrationDeleted: "Event registration removed",
    genericError: "An error occurred",
    termsAccepted: "Terms accepted. Welcome!",
    termsAcceptError: "An error occurred. Please try again.",
    signedOut: "Signed out.",
    signOutError: "An error occurred while signing out.",
    loading: "Loading...",
    error: "Error",
    title: "Your Profile",
    emailPreferences: "Email Preferences",
    emailNotifications: "Email Notifications",
    emailNotificationsHelp: "Receive emails about events and updates",
    language: "Language",
    languageLabel: "Language",
    languageHelp: "Choose the language you want to view the site in",
    updating: "Updating...",
    registeredEvents: "Registered Events",
    noEventsTitle: "No registered events yet",
    noEventsBody: "When you register for an event, its QR ticket shows up here.",
    browseEvents: "Browse events",
    accountSettings: "Account Settings",
    deleteAccount: "Delete Account",
    deleteAccountBody:
      "Permanently delete your account and all of your data. This action cannot be undone.",
    confirmTitle: "Are you sure?",
    confirmBody: "Are you sure you want to delete your event registration?",
    cancel: "Cancel",
    delete: "Delete",
  },
};

const Profile = () => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);
  const [qrCodes, setQRCodes] = useState({});
  const [isEmailUpdateLoading, setIsEmailUpdateLoading] = useState(false);
  const [userWantsEmails, setUserWantsEmails] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const router = useRouter();
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoadingData(false);
        return;
      }

      try {
        const registrationsSnapshot = await getDocs(
          query(collection(db, "registrations"), where("userId", "==", user.uid))
        );
        const registrationsData = registrationsSnapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }));
        setRegistrations(registrationsData);

        const uniqueEventIds = [...new Set(registrationsData.map((reg) => reg.eventId))];
        if (uniqueEventIds.length === 0) {
          setEvents([]);
          setLoadingData(false);
          return;
        }

        const eventsData = [];
        for (const id of uniqueEventIds) {
          const eventSnapshot = await getDocs(
            query(collection(db, "events"), where("id", "==", id))
          );
          eventSnapshot.forEach((entry) => {
            eventsData.push({ id: entry.id, ...entry.data() });
          });
        }

        setEvents(eventsData);
        setLoadingData(false);
      } catch (fetchError) {
        logger.error("Error fetching profile data:", fetchError);
        setErrorData(copy.profileLoadError);
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user, copy.profileLoadError]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.replace(loginHref("/profile"));
    }
  }, [loadingAuth, user, router]);

  useEffect(() => {
    const fetchQRCodes = async () => {
      if (registrations.length > 0 && user) {
        const qrCodesData = {};
        for (const registration of registrations) {
          if (registration.qrCodeId) {
            try {
              const qrCodeSnap = await getDoc(doc(db, "qrCodes", registration.qrCodeId));

              if (qrCodeSnap.exists()) {
                const qrCodeDataURL = await QRCode.toDataURL(qrCodeSnap.data().code, {
                  errorCorrectionLevel: "H",
                  margin: 2,
                  width: 400,
                  color: {
                    dark: "#000000",
                    light: "#ffffff",
                  },
                });

                qrCodesData[registration.qrCodeId] = qrCodeDataURL;
              }
            } catch (qrError) {
              logger.error("Error fetching QR code:", qrError);
            }
          }
        }
        setQRCodes(qrCodesData);
      }
    };

    if (user) {
      fetchQRCodes();
    }
  }, [registrations, user]);

  useEffect(() => {
    const fetchUserEmailPreference = async () => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            setUserWantsEmails(userSnap.data().wantsToGetEmails || false);
          }
        } catch (prefError) {
          logger.error("Error fetching user email preference:", prefError);
        }
      }
    };

    fetchUserEmailPreference();
  }, [user]);

  useEffect(() => {
    const checkConsentStatus = async () => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));

          if (userSnap.exists()) {
            const hasAccepted = userSnap.data().termsAccepted || false;

            if (!hasAccepted) {
              setShowConsentModal(true);
            }
          } else {
            setShowConsentModal(true);
          }
        } catch (consentError) {
          logger.error("Error checking consent status:", consentError);
        }
      }
    };

    checkConsentStatus();
  }, [user]);

  const removeRegistration = async (registrationId) => {
    try {
      const registrationRef = doc(db, "registrations", registrationId);
      const registrationSnap = await getDoc(registrationRef);

      if (!registrationSnap.exists()) {
        toast.error(copy.registrationMissing);
        return;
      }

      const registrationData = registrationSnap.data();
      const qrCodeId = registrationData.qrCodeId;
      const batch = writeBatch(db);
      batch.delete(registrationRef);

      if (qrCodeId) {
        batch.delete(doc(db, "qrCodes", qrCodeId));
      }

      await batch.commit();

      setRegistrations((prev) => prev.filter((reg) => reg.id !== registrationId));

      const updatedRegistrations = registrations.filter(
        (reg) => reg.id !== registrationId
      );
      const uniqueRemainingEventIds = [
        ...new Set(updatedRegistrations.map((reg) => reg.eventId)),
      ];

      setEvents((prev) =>
        prev.filter((event) => uniqueRemainingEventIds.includes(event.id))
      );
    } catch (deleteError) {
      logger.error("Error removing registration:", deleteError);
      toast.error(copy.registrationDeleteError);
    }
  };

  const downloadQRCode = (qrCodeDataURL, eventName) => {
    const link = document.createElement("a");
    link.href = qrCodeDataURL;
    link.download = `${eventName}-registration-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailPreferenceChange = async (newPreference) => {
    setIsEmailUpdateLoading(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { wantsToGetEmails: newPreference },
        { merge: true }
      );
      setUserWantsEmails(newPreference);
      toast.success(copy.emailPrefSaved);
    } catch (prefError) {
      logger.error("Error updating email preference:", prefError);
      toast.error(copy.emailPrefError);
    } finally {
      setIsEmailUpdateLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (registrationToDelete) {
      try {
        await removeRegistration(registrationToDelete.id);
        toast.success(copy.registrationDeleted);
      } catch (_error) {
        toast.error(copy.genericError);
      }
    }
    setIsDeleteDialogOpen(false);
    setRegistrationToDelete(null);
  };

  const handleAcceptTerms = async () => {
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setShowConsentModal(false);
      toast.success(copy.termsAccepted);
    } catch (acceptError) {
      logger.error("Error accepting terms:", acceptError);
      toast.error(copy.termsAcceptError);
    }
  };

  const handleDeclineTerms = async () => {
    try {
      await signOut(auth);
      toast.info(copy.signedOut);
      router.push("/");
    } catch (declineError) {
      logger.error("Error signing out:", declineError);
      toast.error(copy.signOutError);
    }
  };

  // Also covers the moment before a signed-out visitor is sent to the login page.
  if (!errorAuth && (loadingAuth || loadingData || !user)) {
    return (
      <PageContainer aria-busy="true">
        <p className="sr-only">{copy.loading}</p>
        <Skeleton className="h-12 w-48 md:h-14" />
        <div className="mt-8 flex max-w-2xl items-center gap-4 border-t border-rule pt-8">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <Skeleton className="mt-14 h-7 w-56" />
        <Skeleton className="mt-4 h-24 w-full" />
      </PageContainer>
    );
  }

  if (errorAuth) {
    return (
      <PageContainer>
        <p className="text-lg text-error" role="alert">
          {copy.error}: {errorAuth.message}
        </p>
      </PageContainer>
    );
  }

  if (errorData) {
    return (
      <PageContainer>
        <p className="text-lg text-error" role="alert">
          {copy.error}: {errorData}
        </p>
      </PageContainer>
    );
  }

  return (
    <div ref={profileRef}>
      <PageContainer>
        <PageHeader title={copy.title} />

        {user && (
          <div className="max-w-2xl">
            <UserInfo user={user} />
          </div>
        )}

        <Section title={copy.registeredEvents}>
          {registrations.length === 0 ? (
            <EmptyState
              title={copy.noEventsTitle}
              description={copy.noEventsBody}
              action={
                <Button asChild variant="outline">
                  <Link href="/events">{copy.browseEvents}</Link>
                </Button>
              }
            />
          ) : (
            <EventList
              registrations={registrations}
              events={events}
              removeRegistration={(registration) => {
                setRegistrationToDelete(registration);
                setIsDeleteDialogOpen(true);
              }}
              qrCodes={qrCodes}
              downloadQRCode={downloadQRCode}
            />
          )}
        </Section>

        <Section title={copy.emailPreferences}>
          <div className="flex flex-col items-start justify-between gap-4 border-b border-rule py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="email-notifications" className="text-base">
                {copy.emailNotifications}
              </Label>
              <p className="break-words text-sm text-muted-foreground">
                {copy.emailNotificationsHelp}
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={userWantsEmails}
              onCheckedChange={handleEmailPreferenceChange}
              disabled={isEmailUpdateLoading}
              className="shrink-0"
            />
          </div>
          {isEmailUpdateLoading && (
            <p className="mt-2 text-sm text-muted-foreground">{copy.updating}</p>
          )}
        </Section>

        <Section title={copy.language}>
          <div className="flex flex-col items-start justify-between gap-4 border-b border-rule py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-base font-medium">{copy.languageLabel}</p>
              <p className="break-words text-sm text-muted-foreground">{copy.languageHelp}</p>
            </div>
            <div className="shrink-0">
              <LanguageSwitcher />
            </div>
          </div>
        </Section>

        <Section title={copy.accountSettings}>
          <div className="flex flex-col items-start justify-between gap-4 border-b border-rule py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-lg font-semibold text-error">{copy.deleteAccount}</h3>
              <p className="break-words text-sm text-muted-foreground">
                {copy.deleteAccountBody}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="shrink-0"
            >
              <Trash2 />
              {copy.deleteAccount}
            </Button>
          </div>
        </Section>
      </PageContainer>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.confirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              {copy.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleConfirmDelete}
            >
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
      />

      <TermsConsentModal
        isOpen={showConsentModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Profile;
