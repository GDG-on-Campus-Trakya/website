"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const linkClass =
  "inline-flex min-h-11 items-center whitespace-nowrap rounded-sm text-sm text-ink-2 underline-offset-4 decoration-brand decoration-2 transition-colors duration-micro ease-out hover:text-ink hover:underline";

const socialLinks = [
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/gdscedirne/posts/?feedView=all"
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/gdgoncampustu/"
  },
  {
    name: "GitHub",
    url: "https://github.com/GDG-on-Campus-Trakya/GDG-on-Campus-Trakya-Website"
  }
];

export default function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  const pageLinks = [
    { href: "/about", label: t("about") },
    { href: "/events", label: t("events") },
    { href: "/announcements", label: t("announcements") },
    { href: "/projects", label: t("projects") },
    { href: "/social", label: t("socialMedia") },
    { href: "/faq", label: t("faq") },
    { href: "/game", label: t("game") },
    { href: "/typing-test", label: t("typingTest") },
    { href: "/personality-test", label: t("personalityTest") }
  ];

  const legalLinks = [
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/cookie-policy", label: t("cookiePolicy") },
    { href: "/tickets", label: t("support") }
  ];

  return (
    <footer
      className="mt-auto border-t border-rule bg-paper text-ink"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto w-full max-w-page px-gutter pb-6 pt-10 md:pt-14">
        {/* Mast: wordmark and one plain sentence on the left, follow links on the right */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3 rounded-sm">
              <Image src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10" />
              <span className="font-display text-2xl font-extrabold leading-none tracking-tight">
                GDG on Campus
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">{t("followUs")}</p>
            <ul className="mt-1 flex flex-wrap gap-x-5">
              {socialLinks.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sitemap as one wrapped line of plain links, not columns */}
        <nav aria-label={t("pages")} className="mt-8 border-t border-rule pt-3">
          <ul className="flex flex-wrap gap-x-6">
            {pageLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-2 flex flex-col gap-1 border-t border-rule pt-3 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-6">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="font-outlier text-xs text-muted-foreground">{t("rights", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
