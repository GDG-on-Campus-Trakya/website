"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";
import { checkUserRole } from "../utils/roleUtils";

function NavbarContent() {
  const [user, loading] = useAuthState(auth);
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userProfilePhoto, setUserProfilePhoto] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");

  const isLandingPage = pathname === "/";

  const navItems = [
    { href: "/about", label: t("about") },
    { href: "/events", label: t("events") },
    { href: "/announcements", label: t("announcements") },
    { href: "/projects", label: t("projects") },
    { href: "/personality-test", label: t("personalityTests"), accent: "text-purple-300", hoverColor: "#A78BFA" }
  ];

  const authenticatedItems = [
    { href: "/game", label: t("joinGame"), hoverColor: "#A78BFA" },
    { href: "/social", label: t("social"), hoverColor: "#F59E0B" },
    { href: "/tickets", label: t("support"), hoverColor: "#EF4444" }
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loginWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, googleProvider);

      if (result?.user) {
        const { uid, email, displayName } = result.user;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email,
            createdAt: new Date().toISOString(),
            name: displayName,
            wantsToGetEmails: true,
            language: locale
          });
        }
      }
    } catch (error) {
      logger.error("Error during sign-in:", error);

      if (error.code === "auth/popup-blocked") {
        alert(
          locale === "en"
            ? "Popup was blocked. Please allow popups in your browser and try again."
            : "Popup engellendi! Lütfen tarayıcınızda popup engellemesini kapatın ve tekrar deneyin."
        );
      } else if (error.code === "auth/popup-closed-by-user") {
        logger.log("User closed the sign-in popup");
      } else if (error.code === "auth/cancelled-popup-request") {
        logger.log("Another sign-in process is already active");
      } else {
        alert(
          locale === "en"
            ? "An error occurred during sign-in. Please try again."
            : "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProfileMenuOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      logger.error("Error during sign-out:", error);
    }
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(false);
    router.push("/profile");
  };

  const handleOutsideClick = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
    if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
      setProfileMenuOpen(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfilePhoto(userData.photoURL || user.photoURL || "/logo.svg");
          } else {
            setUserProfilePhoto(user.photoURL || "/logo.svg");
          }

          const role = await checkUserRole(user.email);
          setUserRole(role);
        } catch (error) {
          logger.error("Error fetching user data:", error);
          setUserProfilePhoto(user.photoURL || "/logo.svg");
          setUserRole(null);
        }
      } else {
        setUserProfilePhoto(null);
        setUserRole(null);
      }
    };

    fetchUserData();
  }, [user, locale]);

  useEffect(() => {
    if (menuOpen || profileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen, profileMenuOpen]);

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`${
        isLandingPage
          ? "bg-gradient-to-b from-gray-900 to-gray-900"
          : "bg-black/70 backdrop-blur-md"
      } sticky top-0 z-50 transition-all duration-300`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)"
      }}
    >
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-20 text-white">
        <div className="flex items-center">
          <div className="md:hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen((prev) => !prev)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setMenuOpen((prev) => !prev);
              }}
              className="p-2 text-white focus:outline-none touch-manipulation select-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} className="hidden md:flex items-center">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt={t("homeAlt")}
                width={80}
                height={80}
                className="w-16 h-16 lg:w-20 lg:h-20 cursor-pointer"
                priority
              />
            </Link>
          </motion.div>
        </div>

        <div className="hidden md:flex gap-8 text-base font-medium flex-1 justify-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} prefetch={false}>
              <motion.span
                whileHover={{ scale: 1.1, color: item.hoverColor || "#60A5FA" }}
                className={`hover:text-blue-400 transition cursor-pointer ${item.accent || ""}`}
              >
                {item.label}
              </motion.span>
            </Link>
          ))}

          {isMounted &&
            user &&
            authenticatedItems.map((item) => (
              <Link key={item.href} href={item.href} prefetch={false}>
                <motion.span
                  whileHover={{ scale: 1.1, color: item.hoverColor }}
                  className="transition cursor-pointer"
                >
                  {item.label}
                </motion.span>
              </Link>
            ))}

          {userRole && (
            <Link href="/admin" prefetch={false}>
              <motion.span
                whileHover={{ scale: 1.1, color: "#10B981" }}
                className="hover:text-green-400 transition cursor-pointer font-semibold"
              >
                {t("admin")}
              </motion.span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {!isMounted || loading ? (
            <div className="h-10 w-24 rounded-lg border border-white/10 bg-white/5" aria-hidden="true" />
          ) : user ? (
            <div className="relative">
              <motion.img
                whileHover={{ scale: 1.1 }}
                src={userProfilePhoto || "/logo.svg"}
                alt={t("viewProfile")}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow cursor-pointer border-2 border-blue-500 touch-manipulation select-none"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setProfileMenuOpen((prev) => !prev);
                }}
              />
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    ref={profileMenuRef}
                    className="absolute top-10 sm:top-12 right-0 bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-lg shadow-lg py-2 w-48 sm:w-56 z-[9999] border border-gray-700"
                  >
                    <div className="px-3 sm:px-4 py-2 border-b border-gray-700">
                      <p className="font-bold text-blue-400 text-sm sm:text-base truncate">
                        {user.displayName || t("defaultUser")}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{user.email}</p>
                    </div>

                    <motion.button
                      whileHover={{ backgroundColor: "#374151" }}
                      className="block w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 transition-colors text-sm touch-manipulation"
                      onClick={handleProfileClick}
                    >
                      {t("viewProfile")}
                    </motion.button>
                    {userRole && (
                      <motion.button
                        whileHover={{ backgroundColor: "#374151" }}
                        className="block w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 transition-colors text-sm touch-manipulation font-semibold text-green-400"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          router.push("/admin");
                        }}
                      >
                        {t("admin")}
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ backgroundColor: "#374151" }}
                      className="block w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 transition-colors text-sm touch-manipulation"
                      onClick={handleSignOut}
                    >
                      {t("logout")}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/login")}
              className="px-3 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-white font-semibold transition duration-300 text-sm sm:text-base touch-manipulation select-none"
            >
              {t("login")}
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              ref={menuRef}
              className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg z-[9999] border-t border-gray-700"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <motion.button
                    key={item.href}
                    whileHover={{ backgroundColor: "#374151" }}
                    className={`block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation ${item.accent || ""}`}
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(item.href);
                    }}
                  >
                    {item.label}
                  </motion.button>
                ))}

                {isMounted &&
                  user &&
                  authenticatedItems.map((item) => (
                    <motion.button
                      key={item.href}
                      whileHover={{ backgroundColor: "#374151" }}
                      className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(item.href);
                      }}
                    >
                      {item.label}
                    </motion.button>
                  ))}

                {userRole && (
                  <motion.button
                    whileHover={{ backgroundColor: "#374151" }}
                    className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation font-semibold text-green-400"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/admin");
                    }}
                  >
                    {t("admin")}
                  </motion.button>
                )}

                {isMounted && !loading && !user && (
                  <motion.button
                    whileHover={{ backgroundColor: "#2563EB" }}
                    className="block w-full text-left py-3 px-4 bg-blue-600 rounded touch-manipulation font-semibold"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/login");
                    }}
                  >
                    {t("login")}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.div>
  );
}

export default function Navbar() {
  const t = useTranslations("nav");

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <NavbarContent />
    </Suspense>
  );
}
