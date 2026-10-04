"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { popupResolver, preparePopupSignIn } from "@/lib/firebase/auth";
import { logger } from "@/utils/logger";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import {
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useRouter } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from "lucide-react";

const COPY = {
  tr: {
    confirmationText: "sil",
    invalidConfirmation: "Onaylamak için kutuya sil yaz.",
    noSession: "Oturumun kapanmış. Yeniden giriş yapıp tekrar dene.",
    success: "Hesabın silindi.",
    reauthInfo: "Güvenlik için Google hesabınla yeniden giriş yapman gerekiyor.",
    reauthCancelled: "Yeniden giriş iptal edildi; güvenlik için çıkış yapıldı.",
    reauthFailed: "Yeniden giriş yapılamadı; güvenlik için çıkış yapıldı.",
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
    invalidConfirmation: "Type delete in the box to confirm.",
    noSession: "Your session has ended. Sign in again and try once more.",
    success: "Your account has been deleted.",
    reauthInfo: "For security, sign in with your Google account again.",
    reauthCancelled: "Signing in again was cancelled; you were signed out for security.",
    reauthFailed: "Signing in again failed; you were signed out for security.",
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

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [user] = useAuthState(auth);
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmationValid = fold(confirmationText) === fold(copy.confirmationText);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Deleting may ask for a fresh Google sign-in; load the popup's iframe while the dialog is open.
  useEffect(() => {
    if (isOpen) preparePopupSignIn();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  const handleDeleteAccount = async () => {
    if (!isConfirmationValid) {
      toast.error(copy.invalidConfirmation);
      return;
    }

    if (!user) {
      toast.error(copy.noSession);
      return;
    }

    setIsDeleting(true);

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "users", user.uid));

      const registrationsSnapshot = await getDocs(
        query(collection(db, "registrations"), where("userId", "==", user.uid))
      );

      const qrCodeIds = [];
      registrationsSnapshot.forEach((entry) => {
        const data = entry.data();
        if (data.qrCodeId) {
          qrCodeIds.push(data.qrCodeId);
        }
        batch.delete(entry.ref);
      });

      for (const qrCodeId of qrCodeIds) {
        batch.delete(doc(db, "qrCodes", qrCodeId));
      }

      const collectionsToDelete = [
        ["posts", "authorId"],
        ["comments", "authorId"],
        ["likes", "userId"],
        ["tickets", "authorId"],
      ];

      for (const [collectionName, fieldName] of collectionsToDelete) {
        const snapshot = await getDocs(
          query(collection(db, collectionName), where(fieldName, "==", user.uid))
        );
        snapshot.forEach((entry) => {
          batch.delete(entry.ref);
        });
      }

      await batch.commit();

      try {
        await deleteUser(user);
        toast.success(copy.success);
        router.push("/");
        onClose();
      } catch (authError) {
        if (authError.code === "auth/requires-recent-login") {
          try {
            toast.info(copy.reauthInfo);
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(user, provider, popupResolver());
            await deleteUser(user);
            toast.success(copy.success);
            router.push("/");
            onClose();
          } catch (reauthError) {
            logger.error("Reauthentication error:", reauthError);
            toast.error(
              reauthError.code === "auth/popup-closed-by-user"
                ? copy.reauthCancelled
                : copy.reauthFailed
            );
            await signOut(auth);
            router.push("/");
            onClose();
          }
        } else {
          throw authError;
        }
      }
    } catch (deleteError) {
      logger.error("Error deleting account:", deleteError);
      toast.error(copy.genericError);
    } finally {
      setIsDeleting(false);
    }
  };



  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText("");
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
        </div>

        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            {copy.cancel}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid || isDeleting}
            className={buttonVariants({ variant: "destructive" })}
          >
            <Trash2 aria-hidden="true" />
            {isDeleting ? copy.deleting : copy.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountModal;
