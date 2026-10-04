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
    profileLoadError: "Profilin yüklenemedi. Sayfayı yenileyip yeniden dene.",
    registrationMissing: "Bu kayıt zaten silinmiş.",
    registrationDeleteError: "Kayıt iptal edilemedi. Bağlantını kontrol edip yeniden dene.",
    emailPrefError: "E-posta tercihin kaydedilemedi. Yeniden dene.",
    termsAcceptError: "Onayın kaydedilemedi. Yeniden dene.",
    signOutError: "Çıkış yapılamadı. Yeniden dene.",
    loading: "Yükleniyor…",
    title: "Profilim",
    tickets: "Biletlerin",
    noEventsTitle: "Henüz bir etkinliğe kayıt olmadın",
    noEventsBody: "Bir etkinliğe kayıt olduğunda QR biletin burada görünür.",
    browseEvents: "Etkinliklere bak",
    details: "Bilgilerin",
    settings: "Ayarlar",
    emailNotifications: "E-posta bildirimleri",
    emailNotificationsHelp: "Yeni etkinlikler ve duyurular e-postana gelsin.",
    languageLabel: "Dil",
    languageHelp: "Sitenin hangi dilde görüneceği.",
    updating: "Kaydediliyor…",
    account: "Hesap",
    deleteAccount: "Hesabını sil",
    deleteAccountBody:
      "Hesabın, etkinlik kayıtların, gönderilerin ve destek taleplerin kalıcı olarak silinir.",
    deleteAccountButton: "Hesabımı sil",
    confirmTitle: "Kayıt iptal edilsin mi?",
    confirmBody: (name) =>
      `${name} kaydın ve QR biletin silinecek. Fikrini değiştirirsen etkinlik sayfasından yeniden kayıt olabilirsin.`,
    cancel: "Vazgeç",
    delete: "Kaydı iptal et",
  },
  en: {
    profileLoadError: "Your profile could not be loaded. Reload the page and try again.",
    registrationMissing: "This registration has already been removed.",
    registrationDeleteError:
      "The registration was not cancelled. Check your connection and try again.",
    emailPrefError: "Your e-mail preference was not saved. Try again.",
    termsAcceptError: "Your consent was not saved. Try again.",
    signOutError: "Could not sign out. Try again.",
    loading: "Loading…",
    title: "My profile",
    tickets: "Your tickets",
    noEventsTitle: "You have not registered for an event yet",
    noEventsBody: "When you register for an event, its QR ticket shows up here.",
    browseEvents: "See events",
    details: "Your details",
    settings: "Settings",
    emailNotifications: "E-mail notifications",
    emailNotificationsHelp: "Get new events and announcements by e-mail.",
    languageLabel: "Language",
    languageHelp: "The language the site is shown in.",
    updating: "Saving…",
    account: "Account",
    deleteAccount: "Delete your account",
    deleteAccountBody:
      "Your account, event registrations, posts and support requests are deleted permanently.",
    deleteAccountButton: "Delete my account",
    confirmTitle: "Cancel this registration?",
    confirmBody: (name) =>
      `Your registration and QR ticket for ${name} will be deleted. If you change your mind, register again on the event page.`,
    cancel: "Keep it",
    delete: "Cancel registration",
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

        const uniqueEventIds = [
          ...new Set(registrationsData.map((reg) => reg.eventId).filter(Boolean)),
        ];
        if (uniqueEventIds.length === 0) {
          setEvents([]);
          setLoadingData(false);
          return;
        }

        // Registrations point at the events' own `id` field. One `in` query per 30 ids (the
        // Firestore limit) instead of one query per registration, one after another.
        const idChunks = [];
        for (let i = 0; i < uniqueEventIds.length; i += 30) {
          idChunks.push(uniqueEventIds.slice(i, i + 30));
        }
        const eventSnapshots = await Promise.all(
          idChunks.map((ids) => getDocs(query(collection(db, "events"), where("id", "in", ids))))
        );
        const eventsData = eventSnapshots.flatMap((snapshot) =>
          // `id` stays the events' own field (registrations point at it); `docId` builds URLs.
          snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data(), docId: entry.id }))
        );

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
        await Promise.all(
          registrations
            .filter((registration) => registration.qrCodeId)
            .map(async (registration) => {
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
            })
        );
        setQRCodes(qrCodesData);
      }
    };

    if (user) {
      fetchQRCodes();
    }
  }, [registrations, user]);

  useEffect(() => {
    // Email preference and terms consent come from the same document; read it once.
    const fetchUserSettings = async () => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));

          if (userSnap.exists()) {
            setUserWantsEmails(userSnap.data().wantsToGetEmails || false);

            if (!userSnap.data().termsAccepted) {
              setShowConsentModal(true);
            }
          } else {
            setShowConsentModal(true);
          }
        } catch (settingsError) {
          logger.error("Error fetching user settings:", settingsError);
        }
      }
    };

    fetchUserSettings();
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
    link.download = `${eventName.replace(/[\\/:*?"<>|]+/g, "").trim() || "gdg"}-qr.png`;
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
      // The switch staying where it was moved is the confirmation.
      setUserWantsEmails(newPreference);
    } catch (prefError) {
      logger.error("Error updating email preference:", prefError);
      toast.error(copy.emailPrefError);
    } finally {
      setIsEmailUpdateLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (registrationToDelete) {
      // The ticket leaving the list is the confirmation; failures are reported inside.
      await removeRegistration(registrationToDelete.id);
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
    } catch (acceptError) {
      logger.error("Error accepting terms:", acceptError);
      toast.error(copy.termsAcceptError);
    }
  };

  const handleDeclineTerms = async () => {
    try {
      await signOut(auth);
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
          {copy.profileLoadError}
        </p>
      </PageContainer>
    );
  }

  if (errorData) {
    return (
      <PageContainer>
        <p className="text-lg text-error" role="alert">
          {errorData}
        </p>
      </PageContainer>
    );
  }

  return (
    <div ref={profileRef}>
      <PageContainer>
        <PageHeader title={copy.title} />

        {/* Tickets first: at the door this is the page people open, and the QR code has to be
            the first thing on it. */}
        <Section title={copy.tickets} className="mt-0 md:mt-0">
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

        {user && (
          <Section title={copy.details}>
            <div className="max-w-2xl">
              <UserInfo user={user} />
            </div>
          </Section>
        )}

        <Section title={copy.settings}>
          <div className="flex flex-col items-start justify-between gap-4 border-b border-rule py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="email-notifications" className="text-base">
                {copy.emailNotifications}
              </Label>
              <p className="break-words text-sm text-muted-foreground">
                {isEmailUpdateLoading ? copy.updating : copy.emailNotificationsHelp}
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

        <Section title={copy.account}>
          <div className="flex flex-col items-start justify-between gap-4 border-b border-rule py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-base font-semibold text-ink">{copy.deleteAccount}</h3>
              <p className="break-words text-sm text-muted-foreground">
                {copy.deleteAccountBody}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="shrink-0 border-error text-error"
            >
              <Trash2 aria-hidden="true" />
              {copy.deleteAccountButton}
            </Button>
          </div>
        </Section>
      </PageContainer>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirmBody(registrationToDelete?.eventName || "")}
            </AlertDialogDescription>
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
