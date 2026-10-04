"use client";

import { signOut } from "firebase/auth";
import Image from "next/image";
import { useEffect, useState, useRef, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { auth } from "@/lib/firebase/auth";
import { useAccount } from "@/app/AuthProvider";
import { logger } from "@/utils/logger";
import IntentLink from "@/components/IntentLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

const linkBase =
  "whitespace-nowrap rounded-sm font-medium underline-offset-[10px] decoration-2 decoration-brand transition-colors duration-micro ease-out hover:text-ink hover:underline aria-[current=page]:text-ink aria-[current=page]:underline";

function NavLink({ href, active, className = "", children, onClick }) {
  return (
    <IntentLink
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`${linkBase} ${className}`}
    >
      {children}
    </IntentLink>
  );
}

function NavbarContent() {
  const { user, loading, profile, role: userRole } = useAccount();
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");

  const userProfilePhoto = profile?.photoURL || user?.photoURL || "/logo.svg";

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const navItems = [
    { href: "/about", label: t("about") },
    { href: "/events", label: t("events") },
    { href: "/announcements", label: t("announcements") },
    { href: "/projects", label: t("projects") },
    { href: "/personality-test", label: t("personalityTests") }
  ];

  const authenticatedItems = [
    { href: "/game", label: t("joinGame") },
    { href: "/social", label: t("social") },
    { href: "/tickets", label: t("support") }
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProfileMenuOpen(false);
      setMenuOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      logger.error("Error during sign-out:", error);
    }
  };

  useEffect(() => {
    if (!menuOpen && !profileMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, profileMenuOpen]);

  // One compact lockup everywhere: the old centred masthead took 212px above every page.
  const wordmark = (
    <Link href="/" aria-label={t("homeAlt")} className="inline-flex shrink-0 items-center gap-2.5 rounded-sm">
      <Image
        src="/logo.svg"
        alt=""
        width={36}
        height={36}
        className="h-8 w-8"
        priority
        // An SVG gains nothing from the image optimizer; serve the file as it is.
        unoptimized
      />
      <span className="flex flex-col text-left">
        <span className="font-display text-lg font-extrabold leading-none tracking-tight">GDG on Campus</span>
        <span className="mt-1 text-[0.6875rem] font-medium uppercase leading-none tracking-[0.14em] text-muted-foreground">
          {t("university")}
        </span>
      </span>
    </Link>
  );

  const showAuth = isMounted && !loading;
  // The sign-in page is the form itself; a second "Sign in" button there is noise.
  const showLoginButton = pathname !== "/login";
  const mobileItems = [...navItems, ...(showAuth && user ? authenticatedItems : [])];

  const toggleMenu = () => {
    // Opening the menu is the intent: have its pages ready by the time a link is tapped.
    if (!menuOpen) mobileItems.forEach((item) => router.prefetch(item.href));
    setMenuOpen((prev) => !prev);
  };

  const menuItemClass = "flex min-h-11 items-center px-4 text-sm hover:bg-secondary aria-[current=page]:font-semibold";

  return (
    <header
      className="sticky top-0 z-sticky border-b border-rule bg-paper lg:static"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto w-full max-w-page px-gutter">
        {/* One row from lg up: wordmark, the pages, then language and account */}
        <div className="hidden h-16 items-center gap-8 lg:flex">
          {wordmark}

          <nav aria-label={t("primaryNavigation")} className="flex items-center gap-6 text-sm text-ink-2 xl:gap-8">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} active={isActive(item.href)} className="py-2">
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-5">
            <LanguageSwitcher />

            {!showAuth ? (
              <div className="h-9 w-24" aria-hidden="true" />
            ) : user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-label={t("account")}
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={userProfilePhoto}
                    alt=""
                    className="h-9 w-9 rounded-full border border-edge object-cover"
                  />
                </button>
                {profileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-dropdown mt-1 w-60 rounded border border-edge bg-popover py-1 shadow-whisper animate-in fade-in-0 duration-short"
                  >
                    <div className="border-b border-rule px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink">
                        {profile?.name || user.displayName || t("defaultUser")}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link href="/profile" role="menuitem" className={menuItemClass}>
                      {t("viewProfile")}
                    </Link>
                    {/* Signed-in pages live here, so the bar stays one row */}
                    {authenticatedItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={menuItemClass}
                      >
                        {item.label}
                      </Link>
                    ))}
                    {userRole && (
                      <Link href="/admin" role="menuitem" className={`${menuItemClass} border-t border-rule`}>
                        {t("admin")}
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex min-h-11 w-full items-center border-t border-rule px-4 text-left text-sm hover:bg-secondary"
                    >
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              showLoginButton && (
                <Button asChild size="sm">
                  <Link href="/login">{t("login")}</Link>
                </Button>
              )
            )}
          </div>
        </div>

        {/* Compact bar below lg */}
        <div className="flex h-14 items-center justify-between lg:hidden" ref={menuRef}>
          {wordmark}
          <button
            type="button"
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t("closeMenu") : t("menu")}
            className="-mr-3 flex h-11 w-11 items-center justify-center rounded"
          >
            {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>

          {menuOpen && (
            <div
              id="mobile-menu"
              className="absolute inset-x-0 top-full z-dropdown max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-rule bg-paper px-gutter pb-6 animate-in fade-in-0 slide-in-from-top-2 duration-short"
            >
              <nav aria-label={t("primaryNavigation")} className="flex flex-col">
                {mobileItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="flex min-h-12 items-center border-b border-rule font-display text-lg font-semibold text-ink-2 aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-brand aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[10px]"
                  >
                    {item.label}
                  </Link>
                ))}
                {showAuth && user && userRole && (
                  <Link
                    href="/admin"
                    className="flex min-h-12 items-center border-b border-rule font-display text-lg font-semibold text-ink-2"
                  >
                    {t("admin")}
                  </Link>
                )}
              </nav>

              <div className="mt-4 flex items-center justify-between gap-4">
                <LanguageSwitcher mobile />
                {!showAuth ? null : user ? (
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/profile">{t("viewProfile")}</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      {t("logout")}
                    </Button>
                  </div>
                ) : (
                  showLoginButton && (
                    <Button asChild>
                      <Link href="/login">{t("login")}</Link>
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-14 lg:h-16" aria-hidden="true" />}>
      <NavbarContent />
    </Suspense>
  );
}
