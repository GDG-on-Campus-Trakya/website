"use client";
// admin/qr-verification/page.js
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { logger } from "@/utils/logger";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Link } from "@/i18n/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";
import { AlertCircle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";

export default function AdminQRVerificationPage() {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          loading: "Loading...",
          accessDenied: "Access denied",
          backToAdmin: "Back to Admin Panel",
          title: "Admin QR Code Verification",
          scanStart: "Start Scanning",
          scanStop: "Stop Scanning",
          scannedCode: "Scanned QR Code",
          cameraError:
            "Unable to access the camera. Please make sure camera permissions are enabled.",
          processError: "Error processing QR code. Please try again.",
          invalidFormat: "Invalid QR code format",
          registrationNotFound: "Registration not found",
          alreadyUsed: "This QR code has already been used!",
          eventNotFound: "Event not found",
          verificationWindow:
            "QR codes can only be verified on the event day and up to 6 hours after.",
          userNotFound: "User not found",
          verified: "Attendance recorded successfully!",
          databaseError: "Database error during verification",
          verifyError: "Error verifying QR code",
          verifiedPrefix: "Verified",
        }
      : {
          loading: "Yükleniyor...",
          accessDenied: "Erişim engellendi",
          backToAdmin: "Admin Paneline Geri Dön",
          title: "Admin QR Kodu Doğrulama",
          scanStart: "Tarama Başlat",
          scanStop: "Tarama Durdur",
          scannedCode: "Taranan QR Kod",
          cameraError:
            "Kameraya erişilemiyor. Lütfen kamera izinlerini verdiğinizden emin olun.",
          processError: "QR kod işlenirken hata oluştu. Lütfen tekrar deneyin.",
          invalidFormat: "Geçersiz QR kod formatı",
          registrationNotFound: "Kayıt bulunamadı",
          alreadyUsed: "Bu QR kod zaten kullanılmış!",
          eventNotFound: "Etkinlik bulunamadı",
          verificationWindow:
            "QR kodu sadece etkinlik günü ve sonrasındaki 6 saat içinde doğrulanabilir!",
          userNotFound: "Kullanıcı bulunamadı",
          verified: "Katılım başarıyla kaydedildi!",
          databaseError: "Doğrulama sırasında veritabanı hatası oluştu",
          verifyError: "QR kod doğrulanırken hata oluştu",
          verifiedPrefix: "Doğrulandı",
        };
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);
        setIsAdmin(adminSnap.exists());
      } catch (error) {
        logger.error("Error checking admin privileges:", error);
        setIsAdmin(false);
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const startScanning = async () => {
    setScanning(true);
    setQRCodeData(null);
    setVerificationResult(null);
    setError(null);

    try {
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state !== Html5Qrcode.state.NOT_STARTED) {
            await scanner.stop();
          }
        } catch (stopError) {
          logger.log("Scanner was already stopped");
        }
        setScanner(null);
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            logger.log("Found QR code:", decodedText);
            setQRCodeData(decodedText);
            await html5QrCode.stop();
            setScanning(false);
            await verifyQRCode(decodedText);
          } catch (error) {
            logger.error("Error processing QR code:", error);
            setError(copy.processError);
          }
        },
        (errorMessage) => {
          // if (!errorMessage.includes("NotFoundException")) {
          //   logger.log("QR code parse error, error =", errorMessage);
          // }
        }
      );
    } catch (error) {
      logger.error("Error starting scanner:", error);
      setError(copy.cameraError);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scanner && scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
      await scanner.stop();
      setScanner(null);
    }
    setScanning(false);
  };

  const verifyQRCode = async (data) => {
    try {
      logger.log("Verifying QR code:", data);
      const match = data.match(/qrCode=([^,\s]+)/);
      const qrCodeId = match ? match[1] : null;

      if (!qrCodeId) {
        setVerificationResult(copy.invalidFormat);
        return;
      }


      try {
        // Get registration data first
        const registrationsRef = collection(db, "registrations");
        const registrationQuery = query(
          registrationsRef,
          where("qrCodeId", "==", qrCodeId)
        );
        const registrationSnapshot = await getDocs(registrationQuery);

        if (registrationSnapshot.empty) {
          setVerificationResult(copy.registrationNotFound);
          return;
        }

        const registrationDoc = registrationSnapshot.docs[0];
        const registrationData = registrationDoc.data();

        if (registrationData.didJoinEvent) {
          toast.info(copy.alreadyUsed);
          return;
        }

        // Get event data to check date
        const eventsRef = collection(db, "events");
        const eventQuery = query(
          eventsRef,
          where("id", "==", registrationData.eventId)
        );
        const eventSnapshot = await getDocs(eventQuery);

        if (eventSnapshot.empty) {
          setVerificationResult(copy.eventNotFound);
          return;
        }

        const eventDoc = eventSnapshot.docs[0];
        const eventData = eventDoc.data();

        // Check if verification is happening within allowed time (event day + 6 hours)
        const turkeyTimezone = 'Europe/Istanbul';

        // Get current time in Turkey timezone
        const now = new Date();
        const currentTime = new Date(now.toLocaleString('en-US', { timeZone: turkeyTimezone }));

        // Parse event date and set to start of day in Turkey timezone
        const eventDate = new Date(eventData.date + 'T00:00:00+03:00'); // Turkey timezone

        // Calculate end of verification period (event day + 6 hours)
        const verificationEndTime = new Date(eventDate);
        verificationEndTime.setDate(verificationEndTime.getDate() + 1); // Next day
        verificationEndTime.setHours(6, 0, 0, 0); // 6 AM next day

        if (currentTime < eventDate || currentTime > verificationEndTime) {
          setVerificationResult(copy.verificationWindow);
          toast.error(copy.verificationWindow);
          return;
        }

        const usersRef = collection(db, "users");
        const docId = registrationData.userId;
        const userDocRef = doc(usersRef, docId);
        const userSnapshot = await getDoc(userDocRef);

        if (!userSnapshot.exists()) {
          setVerificationResult(copy.userNotFound);
          return;
        }

        const userData = userSnapshot.data();

        await updateDoc(registrationDoc.ref, {
          didJoinEvent: true,
          verifiedAt: new Date(),
          verifiedBy: user.email,
        });

        setVerificationResult(
          `${copy.verifiedPrefix}: ${eventData.name} - ${userData.email} - ${userData.name}`
        );
        toast.success(copy.verified);
      } catch (firestoreError) {
        logger.error("Firestore error:", firestoreError);
        setVerificationResult(copy.databaseError);
      }
    } catch (error) {
      logger.error("Error verifying QR code:", error);
      setVerificationResult(copy.verifyError);
      toast.error(copy.verifyError);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

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
      <PageHeader
        title={copy.title}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft aria-hidden="true" />
              {copy.backToAdmin}
            </Link>
          </Button>
        }
      />

      <div className="max-w-md">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 border-l-2 border-error pl-3 text-sm text-error"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <div id="qr-reader" className="w-full"></div>

        {!scanning && (
          <Button onClick={startScanning} className="mt-4 w-full">
            {copy.scanStart}
          </Button>
        )}

        {scanning && (
          <Button onClick={stopScanning} variant="destructive" className="mt-4 w-full">
            {copy.scanStop}
          </Button>
        )}

        {qrCodeData && (
          <div className="mt-6 border-t border-rule pt-4">
            <h2 className="text-sm font-semibold text-ink">{copy.scannedCode}:</h2>
            <p className="mt-1 break-all font-outlier text-sm text-ink-2">{qrCodeData}</p>
          </div>
        )}

        {verificationResult && (
          <div
            role="status"
            className={`mt-4 flex items-start gap-2 border-t-2 pt-4 text-sm font-medium ${
              verificationResult.startsWith(copy.verifiedPrefix)
                ? "border-success text-success"
                : "border-error text-error"
            }`}
          >
            {verificationResult.startsWith(copy.verifiedPrefix) ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <p className="min-w-0 break-words">{verificationResult}</p>
          </div>
        )}
      </div>
      <ToastContainer theme="light" />
    </div>
  );
}
