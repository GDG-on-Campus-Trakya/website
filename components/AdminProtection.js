"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { auth } from "../firebase";
import { checkUserRole, canAccessPage } from "../utils/roleUtils";
import { logger } from "@/utils/logger";

export default function AdminProtection({ children, requiredRole = null }) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          checking: "Checking access...",
          unauthorizedTitle: "Unauthorized Access",
          unauthorizedBody: "You do not have permission to access this page.",
          backToAdmin: "Back to Admin Panel",
        }
      : {
          checking: "Yetki kontrolü yapılıyor...",
          unauthorizedTitle: "Yetkisiz Erişim",
          unauthorizedBody: "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
          backToAdmin: "Admin Paneline Dön",
        };

  const [user, loading] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const checkInProgress = useRef(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (checkInProgress.current || loading) return;

      checkInProgress.current = true;
      setIsChecking(true);

      try {
        if (!user) {
          logger.warn("Unauthorized access attempt:", { resource: pathname });
          router.push("/");
          return;
        }

        const role = await checkUserRole(user.email);
        if (!role) {
          logger.warn("Invalid role access attempt:", {
            email: user.email,
            resource: pathname,
          });
          router.push("/");
          return;
        }

        if (requiredRole && role !== requiredRole) {
          logger.warn("Insufficient role access attempt:", {
            email: user.email,
            role,
            requiredRole,
            resource: pathname,
          });
          router.push("/admin");
          return;
        }

        if (!canAccessPage(role, pathname)) {
          logger.warn("Page access denied:", {
            email: user.email,
            role,
            resource: pathname,
          });
          router.push("/admin");
          return;
        }

        setIsAuthorized(true);
        hasChecked.current = true;
      } catch (error) {
        logger.error("Access check failed:", error);
        router.push("/");
      } finally {
        checkInProgress.current = false;
        setIsChecking(false);
      }
    };

    if (!hasChecked.current || user !== null) {
      checkAccess();
    }
  }, [user, loading, router, pathname, requiredRole]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{copy.checking}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {copy.unauthorizedTitle}
          </h2>
          <p className="text-gray-600 mb-6">{copy.unauthorizedBody}</p>
          <button
            onClick={() => router.push("/admin")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300"
          >
            {copy.backToAdmin}
          </button>
        </div>
      </div>
    );
  }

  return children;
}
