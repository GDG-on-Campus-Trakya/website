"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
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
    confirmationText: "HESABIMI SİLMEK İSTİYORUM",
    invalidConfirmation: "Doğrulama metni yanlış girildi!",
    noSession: "Kullanıcı oturumu bulunamadı!",
    success: "Hesabınız başarıyla silindi!",
    reauthInfo: "Güvenlik için tekrar giriş yapmanız gerekiyor...",
    reauthCancelled:
      "Tekrar giriş işlemi iptal edildi. Güvenlik nedeniyle çıkış yapılıyor...",
    reauthFailed:
      "Tekrar giriş başarısız. Güvenlik nedeniyle çıkış yapılıyor...",
    genericError: "Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.",
    title: "Hesabı Kalıcı Olarak Sil",
    irreversible: "Bu işlem GERİ ALINAMAZ!",
    description:
      "Hesabınızı sildiğinizde aşağıdaki verileriniz kalıcı olarak silinecektir:",
    items: [
      "Profil bilgileriniz ve profil fotoğrafınız",
      "Tüm etkinlik kayıtlarınız ve QR kodlarınız",
      "Paylaştığınız tüm gönderiler ve fotoğraflar",
      "Yaptığınız tüm yorumlar ve beğeniler",
      "Oluşturduğunuz destek biletleri",
    ],
    prompt: "Devam etmek için aşağıdaki metni tam olarak yazın:",
    inputPlaceholder: "Doğrulama metnini buraya yazın...",
    cancel: "İptal",
    deleting: "Siliniyor...",
    delete: "Hesabı Sil",
  },
  en: {
    confirmationText: "I WANT TO DELETE MY ACCOUNT",
    invalidConfirmation: "The confirmation text does not match.",
    noSession: "No active user session was found.",
    success: "Your account has been deleted successfully.",
    reauthInfo: "For security, you need to sign in again...",
    reauthCancelled:
      "Reauthentication was cancelled. You will be signed out for security reasons...",
    reauthFailed:
      "Reauthentication failed. You will be signed out for security reasons...",
    genericError: "An error occurred while deleting the account. Please try again.",
    title: "Permanently Delete Account",
    irreversible: "This action CANNOT be undone!",
    description:
      "If you delete your account, the following data will be removed permanently:",
    items: [
      "Your profile information and profile photo",
      "All event registrations and QR codes",
      "All posts and photos you shared",
      "All comments and likes you made",
      "Support tickets you created",
    ],
    prompt: "To continue, type the following text exactly:",
    inputPlaceholder: "Type the confirmation text here...",
    cancel: "Cancel",
    deleting: "Deleting...",
    delete: "Delete Account",
  },
};

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [user] = useAuthState(auth);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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
    if (confirmationText !== copy.confirmationText) {
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
            await reauthenticateWithPopup(user, provider);
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

  const isConfirmationValid = confirmationText === copy.confirmationText;

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
          <p className="rounded bg-paper-2 px-3 py-2 text-center text-sm font-semibold text-ink">
            {copy.confirmationText}
          </p>
          <Input
            id="delete-confirmation"
            placeholder={copy.inputPlaceholder}
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            disabled={isDeleting}
            autoComplete="off"
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
            <Trash2 />
            {isDeleting ? copy.deleting : copy.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountModal;
