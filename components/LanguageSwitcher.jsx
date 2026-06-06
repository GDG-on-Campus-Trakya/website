"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LanguageSwitcher({ mobile = false }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef(null);
  const languages = [
    {
      code: "tr",
      flag: "🇹🇷",
      shortLabel: "TR",
      label: "Türkçe",
      ariaLabel: t("switchToTurkish")
    },
    {
      code: "en",
      flag: "🇺🇸",
      shortLabel: "EN",
      label: "English",
      ariaLabel: t("switchToEnglish")
    }
  ];
  const activeLanguage =
    languages.find((language) => language.code === locale) || languages[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLocaleChange = (nextLocale) => {
    setIsOpen(false);
    if (nextLocale === locale) return;

    // next-intl's usePathname() returns the locale-agnostic path; replacing
    // with a `locale` option applies the correct prefix and persists the
    // `gdg-locale` cookie automatically (see localeCookie in i18n/routing.js).
    const search = typeof window === "undefined" ? "" : window.location.search;
    router.replace(`${pathname}${search}`, { locale: nextLocale, scroll: false });
  };

  return (
    <div
      ref={switcherRef}
      className={`relative ${mobile ? "w-full" : "w-[104px]"}`}
      aria-label={t("languageLabel")}
    >
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("languageLabel")}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
          mobile ? "h-12 text-base" : "h-10 text-sm"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className={mobile ? "text-2xl leading-none" : "text-xl leading-none"} aria-hidden="true">
            {activeLanguage.flag}
          </span>
          <span className="tracking-wide">{activeLanguage.shortLabel}</span>
        </span>
        <span
          className={`h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-white/70 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute right-0 top-full z-[10000] overflow-hidden rounded-lg border border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 py-1.5 text-white shadow-xl ${
              mobile ? "w-full" : "w-[104px]"
            }`}
            role="listbox"
            aria-label={t("languageLabel")}
          >
            {languages.map((language) => {
              const isActive = locale === language.code;

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLocaleChange(language.code)}
                  aria-label={language.ariaLabel}
                  className={`relative flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-white/10 text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-r before:bg-blue-400"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    {language.flag}
                  </span>
                  <span className="min-w-6 tracking-wide">{language.shortLabel}</span>
                  <span className="sr-only">{language.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
