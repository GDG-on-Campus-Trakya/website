"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const LANGUAGES = [
  { code: "tr", shortLabel: "TR", ariaKey: "switchToTurkish" },
  { code: "en", shortLabel: "EN", ariaKey: "switchToEnglish" }
];

// Two visible options, no dropdown. The active one is set in ink with an accent underline.
export default function LanguageSwitcher({ mobile = false }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  const handleLocaleChange = (nextLocale) => {
    if (nextLocale === locale) return;

    // next-intl's usePathname() returns the locale-agnostic path; replacing
    // with a `locale` option applies the correct prefix and persists the
    // `gdg-locale` cookie automatically (see localeCookie in i18n/routing.js).
    const search = typeof window === "undefined" ? "" : window.location.search;
    router.replace(`${pathname}${search}`, { locale: nextLocale, scroll: false });
  };

  return (
    <div
      role="group"
      aria-label={t("languageLabel")}
      className={`inline-flex items-center ${mobile ? "gap-2" : "gap-1"}`}
    >
      {LANGUAGES.map((language) => {
        const isActive = locale === language.code;

        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            onClick={() => handleLocaleChange(language.code)}
            aria-label={t(language.ariaKey)}
            aria-pressed={isActive}
            className={`min-w-0 rounded-sm px-2 font-outlier text-sm font-medium transition-colors duration-micro ease-out underline-offset-[6px] decoration-2 decoration-brand ${
              mobile ? "h-11" : "h-9"
            } ${
              isActive
                ? "text-ink underline"
                : "text-muted-foreground hover:text-ink"
            }`}
          >
            {language.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
