"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { popupResolver, preparePopupSignIn } from "@/lib/firebase/auth";
import { logger } from "@/utils/logger";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from "lucide-react";

const COPY = {
  tr: {
    confirmationText: "sil",
    noSession: "Oturumun kapanmış. Yeniden giriş yapıp tekrar dene.",
    success: "Hesabın silindi.",
    reauthGoogle: "Silmeden önce güvenlik için Google hesabınla yeniden giriş yapman istenecek.",
    password: "Şifren",
    passwordHelp: "Silmeden önce güvenlik için şifreni gir.",
    passwordRequired: "Şifreni gir.",
    wrongPassword: "Şifre yanlış. Hesabın silinmedi.",
    reauthCancelled: "Yeniden giriş iptal edildi; hesabın silinmedi.",
    reauthFailed: "Yeniden giriş yapılamadı; hesabın silinmedi.",
    genericError: "Hesap silinemedi. Bağlantını kontrol edip yeniden dene.",
    title: "Hesabını sil",
    irreversible: "Bu geri alınamaz.",
    description: "Hesabınla birlikte şunlar kalıcı olarak silinir:",
    items: [
      "Profil bilgilerin ve fotoğrafın",
      "Etkinlik kayıtların ve QR biletlerin",
      "Paylaştığın gönderiler ve fotoğraflar",
      "Yorumların ve beğenilerin",
      "Destek taleplerin",
    ],
    prompt: "Onaylamak için kutuya sil yaz.",
    inputPlaceholder: "sil",
    cancel: "Vazgeç",
    deleting: "Siliniyor…",
    delete: "Hesabımı sil",
  },
  en: {
    confirmationText: "delete",
    noSession: "Your session has ended. Sign in again and try once more.",
    success: "Your account has been deleted.",
    reauthGoogle: "Before deleting, you will be asked to sign in with your Google account again.",
    password: "Your password",
    passwordHelp: "Enter your password before deleting, for security.",
    passwordRequired: "Enter your password.",
    wrongPassword: "Wrong password. Your account was not deleted.",
    reauthCancelled: "Signing in again was cancelled; your account was not deleted.",
    reauthFailed: "Signing in again failed; your account was not deleted.",
    genericError: "The account was not deleted. Check your connection and try again.",
    title: "Delete your account",
    irreversible: "This cannot be undone.",
    description: "Along with your account, these are deleted permanently:",
    items: [
      "Your profile details and photo",
      "Your event registrations and QR tickets",
      "Posts and photos you shared",
      "Your comments and likes",
      "Your support requests",
    ],
    prompt: "Type delete in the box to confirm.",
    inputPlaceholder: "delete",
    cancel: "Keep my account",
    deleting: "Deleting…",
    delete: "Delete my account",
  },
};

// Phone keyboards capitalise the first letter and an English keyboard has no dotted İ, so the
// typed word is compared without case and with İ/ı folded to I/i.
const fold = (text) =>
  text.trim().toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/i̇/g, "i");

// The server deletes only within five minutes of signing in (see app/api/deleteAccount);
// a little margin covers the time it takes to type the confirmation.
const RECENT_LOGIN_MS = 4 * 60 * 1000;

/**
 * Account deletion runs on the server with the Admin SDK, data and sign-in account together.
 * When the last sign-in is not recent, the person signs in again here first (Google popup or
 * password), so a cancelled or failed re-login never leaves a half-deleted account.
 */
const DeleteAccountModal = ({ isOpen, onClose }) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [user] = useAuthState(auth);
  const [confirmationText, setConfirmationText] = useState("");
  const [password, setPassword] = useState("");
  const [needsReauth, setNeedsReauth] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const providers = user?.providerData.map((entry) => entry.providerId) || [];
  const usesPassword = providers.includes("password");
  const isConfirmationValid = fold(confirmationText) === fold(copy.confirmationText);

  useEffect(() => {
    if (!isOpen || !user) return undefined;
    let active = true;
    setError(null);
    // Google re-login opens a popup; load its iframe while the dialog is open.
    if (!usesPassword) preparePopupSignIn();
    user
      .getIdTokenResult()
      .then(({ authTime }) => {
        if (active) setNeedsReauth(Date.now() - Date.parse(authTime) > RECENT_LOGIN_MS);
      })
      .catch(() => active && setNeedsReauth(true));
    return () => {
      active = false;
    };
  }, [isOpen, user, usesPassword]);

  const reauthenticate = async () => {
    if (usesPassword) {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    } else {
      await reauthenticateWithPopup(user, new GoogleAuthProvider(), popupResolver());
    }
  };

  const reauthMessage = (reauthError) => {
    switch (reauthError?.code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
        return copy.wrongPassword;
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return copy.reauthCancelled;
      default:
        return copy.reauthFailed;
    }
  };

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid || isDeleting) return;
    if (!user) {
      setError(copy.noSession);
      return;
    }
    if (needsReauth && usesPassword && !password) {
      setError(copy.passwordRequired);
      return;
    }

    setIsDeleting(true);
    setError(null);

    if (needsReauth) {
      try {
        await reauthenticate();
        setNeedsReauth(false);
      } catch (reauthError) {
        logger.warn("Reauthentication before account deletion failed:", reauthError?.code);
        setError(reauthMessage(reauthError));
        setIsDeleting(false);
        return;
      }
    }

    try {
      const token = await user.getIdToken(true);
      const response = await fetch("/api/deleteAccount", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        // The server judged the sign-in too old after all; ask for it and let them retry.
        setNeedsReauth(true);
        setError(usesPassword ? copy.passwordHelp : copy.reauthGoogle);
        return;
      }
      if (!response.ok) throw new Error(`Delete account failed with ${response.status}`);

      // The account is gone on the server; drop the local session too.
      await signOut(auth).catch(() => {});
      toast.success(copy.success);
      setConfirmationText("");
      setPassword("");
      onClose();
      router.push("/");
    } catch (deleteError) {
      logger.error("Error deleting account:", deleteError);
      setError(copy.genericError);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText("");
      setPassword("");
      setError(null);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {copy.title}
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-2 text-ink-2">
              <p className="font-semibold text-error">{copy.irreversible}</p>
              <p>{copy.description}</p>
              <ul className="list-disc space-y-1 pl-5">
                {copy.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 border-t border-rule pt-4">
          <Label htmlFor="delete-confirmation" className="leading-normal">
            {copy.prompt}
          </Label>
          <Input
            id="delete-confirmation"
            placeholder={copy.inputPlaceholder}
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            disabled={isDeleting}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />

          {needsReauth && usesPassword && (
            <Field id="delete-password" label={copy.password} help={copy.passwordHelp}>
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                disabled={isDeleting}
                autoComplete="current-password"
              />
            </Field>
          )}
          {needsReauth && !usesPassword && (
            <p className="text-sm text-muted-foreground">{copy.reauthGoogle}</p>
          )}

          <p role="alert" className="min-h-[1lh] text-sm text-error">
            {error}
          </p>
        </div>

        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            {copy.cancel}
          </AlertDialogCancel>

          {/* A plain button: AlertDialogAction would close the dialog before the result is known */}
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid}
            loading={isDeleting}
          >
            <Trash2 aria-hidden="true" />
            {isDeleting ? copy.deleting : copy.delete}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountModal;
