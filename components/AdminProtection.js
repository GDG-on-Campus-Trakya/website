"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { auth } from "../firebase";
import { checkUserRole, canAccessPage } from "../utils/roleUtils";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";

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
      <p role="status" className="py-12 text-ink-2">
        {copy.checking}
      </p>
    );
  }

  if (!isAuthorized) {
    return (
      <EmptyState
        title={copy.unauthorizedTitle}
        description={copy.unauthorizedBody}
        action={
          <Button variant="outline" onClick={() => router.push("/admin")}>
            {copy.backToAdmin}
          </Button>
        }
      />
    );
  }

  return children;
}
