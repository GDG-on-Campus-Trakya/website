"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Instagram, MessageSquare, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/ui/page";
import { FAQ_DATA } from "./faq-data";

const COPY = {
  tr: {
    title: "Sık sorulanlar",
    description: "Topluluk, etkinlik kaydı, hesabın ve destek hakkında kısa cevaplar.",
    tipTitle: "Cevabını bulamazsan",
    tipBody: "destek sayfasından talep aç; birkaç gün içinde döneriz.",
    contactTitle: "Sorun hâlâ duruyor mu?",
    contactBody:
      "Burada cevabını bulamadığın bir şey varsa destek talebi aç ya da Instagram'dan yaz.",
    ticketCta: "Destek talebi aç",
    instagramCta: "Instagram'dan yaz",
    quickLinks: {
      about: "Hakkımızda",
      events: "Etkinlikler",
      privacy: "Gizlilik",
      terms: "Kullanım şartları",
    },
    faqData: FAQ_DATA.tr,
  },
  en: {
    title: "FAQ",
    description: "Short answers about the community, event registration, your account and support.",
    tipTitle: "Can't find your answer?",
    tipBody: "Open a request on the support page; we reply within a few days.",
    contactTitle: "Still stuck?",
    contactBody:
      "If your question is not answered here, open a support request or message us on Instagram.",
    ticketCta: "Open a support request",
    instagramCta: "Message us on Instagram",
    quickLinks: {
      about: "About",
      events: "Events",
      privacy: "Privacy",
      terms: "Terms",
    },
    faqData: FAQ_DATA.en,
  },
};

export default function FAQ() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const router = useRouter();
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const quickLinks = [
    { href: "/about", label: copy.quickLinks.about },
    { href: "/events", label: copy.quickLinks.events },
    { href: "/privacy", label: copy.quickLinks.privacy },
    { href: "/terms", label: copy.quickLinks.terms },
  ];

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.description}>
        <p className="mt-4 max-w-measure text-sm text-ink-2">
          <strong className="font-semibold text-ink">{copy.tipTitle}</strong> {copy.tipBody}
        </p>
      </PageHeader>

      <div>
        {copy.faqData.map((category, categoryIndex) => (
          <section
            key={category.category}
            className="grid gap-x-8 gap-y-2 border-t-2 border-ink pt-3 md:grid-cols-12 [&:not(:first-child)]:mt-12"
          >
            <h2 className="font-display text-xl font-bold md:col-span-4">{category.category}</h2>

            <div className="min-w-0 divide-y divide-rule border-b border-rule md:col-span-8">
              {category.questions.map((item, questionIndex) => {
                const itemKey = `${categoryIndex}-${questionIndex}`;
                const isOpen = Boolean(openItems[itemKey]);
                const panelId = `faq-panel-${itemKey}`;

                return (
                  <div key={item.question}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => toggleItem(itemKey)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="flex min-h-11 w-full items-start justify-between gap-4 rounded-sm py-4 text-left transition-colors duration-micro ease-out hover:bg-paper-2"
                      >
                        <span className="min-w-0 font-display text-base font-bold leading-snug text-ink">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <Minus className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                        ) : (
                          <Plus className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                        )}
                      </button>
                    </h3>

                    {isOpen && (
                      <div id={panelId} className="pb-5 pr-9">
                        <p className="max-w-measure whitespace-pre-line text-ink-2">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 grid gap-x-8 gap-y-4 border-t-2 border-ink pt-3 md:grid-cols-12">
        <h2 className="font-display text-xl font-bold md:col-span-4">{copy.contactTitle}</h2>
        <div className="md:col-span-8">
          <p className="max-w-measure text-ink-2">{copy.contactBody}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => router.push("/tickets")}>
              <MessageSquare aria-hidden="true" />
              {copy.ticketCta}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("https://www.instagram.com/gdgoncampustu/", "_blank")}
            >
              <Instagram aria-hidden="true" />
              {copy.instagramCta}
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-1 border-t border-rule pt-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <button
                  type="button"
                  onClick={() => router.push(link.href)}
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageContainer>
  );
}
