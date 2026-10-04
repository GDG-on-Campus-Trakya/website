"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAccount } from "@/app/AuthProvider";
import AcademicFields from "@/components/AcademicFields";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { logger } from "@/utils/logger";
import { loginHref } from "@/utils/redirect";

const COPY = {
  tr: {
    signUp: "Kayıt ol",
    signedUp: "Kayıtlısın",
    signInToSignUp: "Kayıt olmak için giriş yap",
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
    signupError: "Kayıt tamamlanamadı. Bağlantını kontrol edip yeniden dene.",
  },
  en: {
    signUp: "Register",
    signedUp: "You are registered",
    signInToSignUp: "Sign in to register",
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
    signupError: "Registration did not go through. Check your connection and try again.",
  },
};

const textLink =
  "font-medium text-brand underline underline-offset-4 decoration-1 hover:decoration-2";

// Registration for one event, shared by the events drawer and the event's own page.
// `event.id` is the event's own id field, which registrations point at. Firestore is loaded
// only once someone is signed in, so signed-out visitors never download it.
export default function EventSignup({ event, returnPath }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const { user, profile, mergeProfile } = useAccount();
  // "checking" until we know whether this user is already registered
  const [status, setStatus] = useState("checking");
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState({ name: "", faculty: "", department: "" });
  const [detailErrors, setDetailErrors] = useState({});

  const eventId = event?.id;

  useEffect(() => {
    setJustSignedUp(false);
    setError(null);
    if (!user || !eventId) {
      setStatus("open");
      return undefined;
    }

    let active = true;
    setStatus("checking");
    (async () => {
      try {
        const { db } = await import("@/firebase");
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const snapshot = await getDocs(
          query(
            collection(db, "registrations"),
            where("eventId", "==", eventId),
            where("userId", "==", user.uid)
          )
        );
        if (active) setStatus(snapshot.empty ? "open" : "registered");
      } catch (checkError) {
        logger.error("Error checking signup status:", checkError);
        if (active) setStatus("open");
      }
    })();

    return () => {
      active = false;
    };
  }, [user, eventId]);

  useEffect(() => {
    setDetails({
      name: profile?.name || user?.displayName || "",
      faculty: profile?.faculty || "",
      department: profile?.department || "",
    });
    setDetailErrors({});
  }, [profile, user]);

  // Registration needs name, faculty and department. Accounts made with Google have none of
  // the last two, so the form asks for whatever is missing instead of sending people away.
  const missingDetails = user
    ? ["name", "faculty", "department"].filter((field) => !profile?.[field]?.trim())
    : [];

  const handleSignup = async () => {
    if (!user || !eventId || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { db } = await import("@/firebase");
      const { collection, doc, getDocs, query, setDoc, where, writeBatch } = await import(
        "firebase/firestore"
      );

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
        if (errors.name || errors.faculty || errors.department) return;

        await setDoc(doc(db, "users", user.uid), { ...fields, email: user.email }, { merge: true });
        mergeProfile(fields);
      }

      const registrationsRef = collection(db, "registrations");
      const existing = await getDocs(
        query(registrationsRef, where("eventId", "==", eventId), where("userId", "==", user.uid))
      );

      if (existing.empty) {
        // The registration and its QR code are written together, so a failure never leaves a
        // registration without a ticket.
        const registrationRef = doc(registrationsRef);
        const qrCodeRef = doc(collection(db, "qrCodes"));
        const batch = writeBatch(db);
        batch.set(registrationRef, {
          eventId,
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

      setStatus("registered");
      setJustSignedUp(true);
    } catch (signupError) {
      logger.error("Error signing up for event:", signupError);
      setError(copy.signupError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={loginHref(returnPath)}>{copy.signInToSignUp}</Link>
      </Button>
    );
  }

  if (status === "registered") {
    return (
      <div className="space-y-3">
        <Button type="button" variant="secondary" size="lg" className="w-full" disabled>
          <Check aria-hidden="true" />
          {copy.signedUp}
        </Button>
        <p role="status" className="text-sm text-ink-2">
          {justSignedUp && `${copy.ticketReady} `}
          <Link href="/profile" className={textLink}>
            {copy.viewTicket}
          </Link>
        </p>
      </div>
    );
  }

  const errorLine = (
    <p role="alert" className="min-h-[1lh] text-sm text-error">
      {error}
    </p>
  );

  if (missingDetails.length > 0) {
    return (
      <div className="border-t border-rule pt-4">
        <p className="font-display text-lg font-bold">{copy.completeTitle}</p>
        <p className="mt-1 text-sm text-ink-2">{copy.completeBody}</p>
        <div className="mt-4 flex flex-col gap-2">
          {missingDetails.includes("name") && (
            <Field id={`signup-name-${eventId}`} label={copy.fullName} error={detailErrors.name}>
              <Input
                value={details.name}
                onChange={(changeEvent) => {
                  setDetails((prev) => ({ ...prev, name: changeEvent.target.value }));
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
              setDetailErrors((prev) => ({ ...prev, faculty: undefined, department: undefined }));
            }}
          />
        </div>
        <Button type="button" size="lg" className="mt-2 w-full" loading={submitting} onClick={handleSignup}>
          {copy.saveAndSignUp}
        </Button>
        {errorLine}
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        className="w-full"
        loading={submitting || status === "checking"}
        onClick={handleSignup}
      >
        {copy.signUp}
      </Button>
      {errorLine}
    </div>
  );
}
