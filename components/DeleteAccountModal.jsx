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
    irreversible: "⚠️ Bu işlem GERİ ALINAMAZ!",
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
    irreversible: "⚠️ This action CANNOT be undone!",
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
      <AlertDialogContent className="max-w-md border-2 border-red-500 bg-gray-800 text-white">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          <AlertDialogTitle className="text-center text-xl font-bold text-red-400">
            {copy.title}
          </AlertDialogTitle>

          <AlertDialogDescription className="space-y-3 text-gray-300">
            <div className="space-y-2 rounded-lg border border-red-500 bg-red-900/20 p-4">
              <p className="font-semibold text-red-300">{copy.irreversible}</p>
              <p className="text-sm">{copy.description}</p>
              <ul className="ml-4 space-y-1 text-sm">
                {copy.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <p className="mb-2 font-medium">{copy.prompt}</p>
              <p className="rounded bg-red-900/30 p-2 text-center font-mono text-red-300">
                {copy.confirmationText}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Input
            placeholder={copy.inputPlaceholder}
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            disabled={isDeleting}
            className="border-gray-600 bg-gray-700 font-mono text-white placeholder-gray-400"
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter className="space-x-2">
          <AlertDialogCancel
            onClick={handleClose}
            disabled={isDeleting}
            className="border-0 bg-gray-700 text-white hover:bg-gray-600"
          >
            {copy.cancel}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={!isConfirmationValid || isDeleting}
            className={`flex items-center gap-2 border-0 text-white ${
              isConfirmationValid
                ? "bg-red-600 hover:bg-red-700"
                : "cursor-not-allowed bg-gray-600"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? copy.deleting : copy.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountModal;
