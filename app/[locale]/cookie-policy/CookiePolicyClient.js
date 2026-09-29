"use client";

import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageContainer } from "@/components/ui/page";

const COPY = {
  tr: {
    title: "Çerez Politikası",
    organization: "GDG on Campus Trakya Üniversitesi",
    updated: "Son Güncelleme: 2 Ekim 2025",
    sections: {
      intro: {
        title: "1. Çerez Nedir?",
        body:
          "Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınız üzerinden cihazınıza kaydedilen küçük veri parçalarıdır. Site işlevlerini sürdürmek, tercihleri hatırlamak ve performansı değerlendirmek için kullanılabilirler.",
      },
      technologies: {
        title: "2. Kullandığımız Çerezler ve Depolama Teknolojileri",
        cards: [
          {
            title: "2.1. Zorunlu Teknolojiler",
            body:
              "Temel oturum ve kimlik doğrulama işlevleri için gerekli saklama mekanizmalarıdır.",
            items: [
              "Firebase Authentication oturum verileri",
              "Geçici oturum verileri için session storage",
            ],
          },
          {
            title: "2.2. Analitik Teknolojiler",
            body:
              "Kullanım davranışını anonim düzeyde anlamamıza yardımcı olur. Tercihlere bağlı olarak sınırlandırılabilir.",
            items: ["Vercel Analytics ile anonim performans ve kullanım ölçümü"],
          },
          {
            title: "2.3. Fonksiyonel Teknolojiler",
            body:
              "Kullanıcı tercihleri ve bazı uygulama durumlarını hatırlamak için kullanılır.",
            items: [
              "Yerel depolama üzerinde tercih bilgileri",
              "Güvenlik ve oturum bağlamı için sınırlı kimlikler",
            ],
          },
        ],
      },
      table: {
        title: "3. Saklama Süreleri",
        headers: ["Teknoloji", "Süre"],
        rows: [
          ["Firebase Auth Token", "Yaklaşık 1 saat, yenilenebilir"],
          ["Session Storage", "Tarayıcı oturumu boyunca"],
          ["Local Storage tercihleri", "Kullanıcı silene kadar"],
          ["Analitik veriler", "Hizmet sağlayıcının teknik politikalarına göre sınırlı süre"],
        ],
      },
      management: {
        title: "4. Çerezleri Nasıl Yönetebilirsiniz?",
        intro: "Tercihlerinizi aşağıdaki yollarla yönetebilirsiniz:",
        items: [
          ["Site üzerinden", "Çerez tercihi arayüzü ile ayarları güncellemek"],
          ["Tarayıcı ayarları", "Çerezleri engellemek veya silmek"],
          ["Geliştirici araçları", "Yerel depolama verilerini incelemek veya temizlemek"],
        ],
        warning:
          "Uyarı: Zorunlu teknolojileri tamamen devre dışı bırakmanız durumunda giriş ve bazı temel işlevler düzgün çalışmayabilir.",
      },
      browsers: {
        title: "5. Tarayıcı Ayarları ile Yönetim",
        items: [
          "Chrome: Ayarlar > Gizlilik ve güvenlik > Çerezler ve diğer site verileri",
          "Firefox: Ayarlar > Gizlilik ve Güvenlik > Çerezler ve Site Verileri",
          "Safari: Tercihler > Gizlilik",
          "Edge: Ayarlar > Çerezler ve site izinleri",
        ],
      },
      thirdParty: {
        title: "6. Üçüncü Taraf Hizmetler",
        intro: "Kullandığımız bazı altyapı hizmetlerinin kendi gizlilik belgeleri vardır:",
        links: [
          ["Firebase Privacy", "https://firebase.google.com/support/privacy"],
          ["Vercel Privacy", "https://vercel.com/legal/privacy-policy"],
        ],
      },
      rights: {
        title: "7. Haklarınız",
        body:
          "KVKK kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltme isteme, silme talep etme ve veri işleme süreçleri hakkında bilgi alma haklarına sahipsiniz.",
      },
      contact: {
        title: "8. İletişim",
        body:
          "Çerez politikasıyla ilgili sorularınız veya talepleriniz için destek sistemi üzerinden bize ulaşabilirsiniz.",
        cta: "Destek sayfasına git",
      },
      updates: {
        title: "9. Politika Değişiklikleri",
        body:
          "Bu politika zaman zaman güncellenebilir. Önemli değişiklikler olduğunda kullanıcıları bilgilendirmeye çalışırız ve güncel sürüm bu sayfada tutulur.",
      },
    },
    footerLinks: {
      terms: "Kullanım Şartları",
      privacy: "Gizlilik Politikası",
      home: "Ana Sayfa",
    },
  },
  en: {
    title: "Cookie Policy",
    organization: "GDG on Campus Trakya University",
    updated: "Last Updated: October 2, 2025",
    sections: {
      intro: {
        title: "1. What Is a Cookie?",
        body:
          "Cookies are small pieces of data stored on your device through your browser when you visit a website. They may be used to keep the site working, remember preferences, and evaluate performance.",
      },
      technologies: {
        title: "2. Cookies and Storage Technologies We Use",
        cards: [
          {
            title: "2.1. Necessary Technologies",
            body:
              "These are storage mechanisms required for core session and authentication behavior.",
            items: [
              "Firebase Authentication session data",
              "Session storage for temporary session context",
            ],
          },
          {
            title: "2.2. Analytics Technologies",
            body:
              "These help us understand usage behavior at an anonymous level and may be limited by preference.",
            items: ["Anonymous usage and performance measurement through Vercel Analytics"],
          },
          {
            title: "2.3. Functional Technologies",
            body:
              "These are used to remember preferences and parts of the application state.",
            items: [
              "Preference data stored in local storage",
              "Limited identifiers for security and session context",
            ],
          },
        ],
      },
      table: {
        title: "3. Retention Periods",
        headers: ["Technology", "Retention"],
        rows: [
          ["Firebase Auth Token", "About 1 hour, renewable"],
          ["Session Storage", "For the browser session"],
          ["Local Storage preferences", "Until removed by the user"],
          ["Analytics data", "Limited duration based on provider policy"],
        ],
      },
      management: {
        title: "4. How You Can Manage Them",
        intro: "You can manage these preferences in the following ways:",
        items: [
          ["On the site", "Update settings through the cookie preference UI"],
          ["Browser settings", "Block or clear cookies"],
          ["Developer tools", "Inspect or clear local storage data"],
        ],
        warning:
          "Warning: If you fully disable necessary technologies, sign-in and some core features may not work properly.",
      },
      browsers: {
        title: "5. Browser-Level Management",
        items: [
          "Chrome: Settings > Privacy and security > Cookies and other site data",
          "Firefox: Settings > Privacy & Security > Cookies and Site Data",
          "Safari: Preferences > Privacy",
          "Edge: Settings > Cookies and site permissions",
        ],
      },
      thirdParty: {
        title: "6. Third-Party Services",
        intro: "Some infrastructure services we use provide their own privacy documents:",
        links: [
          ["Firebase Privacy", "https://firebase.google.com/support/privacy"],
          ["Vercel Privacy", "https://vercel.com/legal/privacy-policy"],
        ],
      },
      rights: {
        title: "7. Your Rights",
        body:
          "Under applicable privacy rules, you may have rights to learn whether your personal data is processed, request corrections, request deletion, and receive information about processing activities.",
      },
      contact: {
        title: "8. Contact",
        body:
          "If you have questions or requests related to this cookie policy, you can reach us through the support system.",
        cta: "Go to support page",
      },
      updates: {
        title: "9. Policy Changes",
        body:
          "This policy may be updated from time to time. We try to communicate material changes, and the latest version is kept on this page.",
      },
    },
    footerLinks: {
      terms: "Terms of Use",
      privacy: "Privacy Policy",
      home: "Home",
    },
  },
};

const h2Class =
  "mt-12 border-t border-rule pt-6 font-display text-xl font-bold first:mt-0 first:border-t-0 first:pt-0";
const h3Class = "mt-6 font-display text-lg font-semibold";
const pClass = "mt-3 text-ink-2";
const listClass = "mt-3 list-disc space-y-1.5 pl-5 text-ink-2";
const linkClass =
  "font-medium text-brand underline underline-offset-4 decoration-1 hover:decoration-2";

export default function CookiePolicyPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  return (
    <PageContainer>
      <header className="mb-10 border-b border-rule pb-6">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">{copy.title}</h1>
        <p className="mt-3 text-md text-ink-2">{copy.organization}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.updated}</p>
      </header>

      <div className="max-w-measure">
        <section>
          <h2 className={h2Class}>{copy.sections.intro.title}</h2>
          <p className={pClass}>{copy.sections.intro.body}</p>
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.technologies.title}</h2>
          {copy.sections.technologies.cards.map((card) => (
            <div key={card.title}>
              <h3 className={h3Class}>{card.title}</h3>
              <p className={pClass}>{card.body}</p>
              <ul className={listClass}>
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.table.title}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  {copy.sections.table.headers.map((header) => (
                    <th
                      key={header}
                      className="py-2 pr-4 text-left align-bottom text-xs font-semibold text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.sections.table.rows.map(([name, value]) => (
                  <tr key={name} className="border-b border-rule">
                    <td className="py-3 pr-4 align-top font-medium text-ink">{name}</td>
                    <td className="py-3 align-top text-ink-2">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.management.title}</h2>
          <p className={pClass}>{copy.sections.management.intro}</p>
          <ul className={listClass}>
            {copy.sections.management.items.map(([label, value]) => (
              <li key={label}>
                <strong className="font-semibold text-ink">{label}:</strong> {value}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded bg-warning px-4 py-3 text-sm text-ink">
            {copy.sections.management.warning}
          </p>
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.browsers.title}</h2>
          <ul className="mt-3 space-y-2 text-ink-2">
            {copy.sections.browsers.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.thirdParty.title}</h2>
          <p className={pClass}>{copy.sections.thirdParty.intro}</p>
          <ul className={listClass}>
            {copy.sections.thirdParty.links.map(([label, href]) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.rights.title}</h2>
          <p className={pClass}>{copy.sections.rights.body}</p>
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.contact.title}</h2>
          <p className={pClass}>{copy.sections.contact.body}</p>
          <p className="mt-3">
            <Link
              href="/tickets"
              className={`inline-flex min-h-11 items-center gap-1 whitespace-nowrap ${linkClass}`}
            >
              {copy.sections.contact.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </section>

        <section>
          <h2 className={h2Class}>{copy.sections.updates.title}</h2>
          <p className={pClass}>{copy.sections.updates.body}</p>
        </section>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-1 border-t border-rule pt-4 text-sm">
          <Link href="/terms" className={`inline-flex min-h-11 items-center whitespace-nowrap ${linkClass}`}>
            {copy.footerLinks.terms}
          </Link>
          <Link href="/privacy" className={`inline-flex min-h-11 items-center whitespace-nowrap ${linkClass}`}>
            {copy.footerLinks.privacy}
          </Link>
          <Link href="/" className={`inline-flex min-h-11 items-center whitespace-nowrap ${linkClass}`}>
            {copy.footerLinks.home}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
