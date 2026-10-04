"use client";

import { useLocale } from "next-intl";
import { Instagram, Linkedin, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page";

const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const COPY = {
  tr: {
    title: "GDG on Campus Trakya Üniversitesi",
    subtitle: "Etkinlik kaydı ve duyurular sitede; anlık haberler sosyal medyada.",
    whatsapp: "Info Session WhatsApp Grubu",
    continue: "Etkinlikler ve kayıt",
    home: "Ana sayfa",
    copyright: (year) => `© ${year} GDG on Campus Trakya Üniversitesi`,
  },
  en: {
    title: "GDG on Campus Trakya University",
    subtitle: "Event registration and announcements are on the site; quick news is on social media.",
    whatsapp: "Info Session WhatsApp Group",
    continue: "Events and registration",
    home: "Home page",
    copyright: (year) => `© ${year} GDG on Campus Trakya University`,
  },
};

export default function WelcomePage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  const socialLinks = [
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/gdgoncampustu/",
    },
    {
      name: "TikTok",
      icon: TikTokIcon,
      url: "https://www.tiktok.com/@gdg.on.campus.trakya?_t=ZS-90WYQTJFhiS&_r=1",
    },
    {
      name: copy.whatsapp,
      icon: WhatsAppIcon,
      url: "https://chat.whatsapp.com/Eqz1kKViz3dBhVRkZs3P5D?mode=wwc",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://www.linkedin.com/company/gdscedirne/posts/?feedView=all",
    },
  ];

  return (
    <PageContainer>
      <div className="max-w-xl">
        <Image
          src="/logo.svg"
          alt="GDG on Campus Trakya"
          width={96}
          height={96}
          className="h-16 w-auto"
          unoptimized
        />
        <h1 className="mt-8 font-display text-display-s font-extrabold">{copy.title}</h1>
        <p className="mt-3 text-md text-ink-2">{copy.subtitle}</p>

        {/* Most visitors arrive from the Instagram bio looking for an event to sign up for. */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Button asChild size="lg">
            <Link href="/events">
              {copy.continue}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2"
          >
            {copy.home}
          </Link>
        </div>

        <ul className="mt-12 border-t-2 border-ink">
          {socialLinks.map((link) => {
            const Icon = link.icon;

            return (
              <li key={link.name}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-14 items-center justify-between gap-4 border-b border-rule py-3 transition-colors duration-micro ease-out hover:bg-paper-2 focus-visible:outline-offset-[-2px]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-ink-2" aria-hidden="true" />
                    <span className="min-w-0 font-medium text-ink group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                      {link.name}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm text-muted-foreground">
          {copy.copyright(new Date().getFullYear())}
        </p>
      </div>
    </PageContainer>
  );
}
