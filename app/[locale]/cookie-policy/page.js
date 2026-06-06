"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

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
            classes: "border-blue-500/30 bg-blue-900/20",
          },
          {
            title: "2.2. Analitik Teknolojiler",
            body:
              "Kullanım davranışını anonim düzeyde anlamamıza yardımcı olur. Tercihlere bağlı olarak sınırlandırılabilir.",
            items: ["Vercel Analytics ile anonim performans ve kullanım ölçümü"],
            classes: "border-green-500/30 bg-green-900/20",
          },
          {
            title: "2.3. Fonksiyonel Teknolojiler",
            body:
              "Kullanıcı tercihleri ve bazı uygulama durumlarını hatırlamak için kullanılır.",
            items: [
              "Yerel depolama üzerinde tercih bilgileri",
              "Güvenlik ve oturum bağlamı için sınırlı kimlikler",
            ],
            classes: "border-purple-500/30 bg-purple-900/20",
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
            classes: "border-blue-500/30 bg-blue-900/20",
          },
          {
            title: "2.2. Analytics Technologies",
            body:
              "These help us understand usage behavior at an anonymous level and may be limited by preference.",
            items: ["Anonymous usage and performance measurement through Vercel Analytics"],
            classes: "border-green-500/30 bg-green-900/20",
          },
          {
            title: "2.3. Functional Technologies",
            body:
              "These are used to remember preferences and parts of the application state.",
            items: [
              "Preference data stored in local storage",
              "Limited identifiers for security and session context",
            ],
            classes: "border-purple-500/30 bg-purple-900/20",
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

export default function CookiePolicyPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] px-4 py-12 text-white">
      <div className="container mx-auto px-4 pb-12 pt-20 sm:pt-24 md:pt-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 bg-clip-text text-4xl font-bold sm:text-5xl">
              {copy.title}
            </h1>
            <p className="text-xl text-gray-300">{copy.organization}</p>
            <p className="mt-2 text-sm text-gray-400">{copy.updated}</p>
          </div>

          <div className="space-y-8 rounded-2xl border border-gray-700/50 bg-gray-800/30 p-8 backdrop-blur-md">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.intro.title}
              </h2>
              <p className="leading-relaxed text-gray-300">{copy.sections.intro.body}</p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.technologies.title}
              </h2>
              <div className="space-y-6">
                {copy.sections.technologies.cards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-lg border p-4 ${card.classes}`}
                  >
                    <h3 className="mb-3 text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mb-3 leading-relaxed text-gray-300">{card.body}</p>
                    <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                      {card.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.table.title}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      {copy.sections.table.headers.map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 bg-gray-800/50">
                    {copy.sections.table.rows.map(([name, value]) => (
                      <tr key={name}>
                        <td className="px-4 py-3 text-sm text-white">{name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.management.title}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                {copy.sections.management.intro}
              </p>
              <ul className="mb-4 ml-4 list-inside list-disc space-y-2 text-gray-300">
                {copy.sections.management.items.map(([label, value]) => (
                  <li key={label}>
                    <strong className="text-white">{label}:</strong> {value}
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/20 p-4">
                <p className="text-sm leading-relaxed text-gray-300">
                  {copy.sections.management.warning}
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.browsers.title}
              </h2>
              <ul className="space-y-2 text-gray-300">
                {copy.sections.browsers.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.thirdParty.title}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                {copy.sections.thirdParty.intro}
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                {copy.sections.thirdParty.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.rights.title}
              </h2>
              <p className="leading-relaxed text-gray-300">{copy.sections.rights.body}</p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.contact.title}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">
                {copy.sections.contact.body}
              </p>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <Link
                  href="/tickets"
                  className="inline-flex items-center gap-2 font-semibold text-blue-400 transition-colors hover:text-blue-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{copy.sections.contact.cta}</span>
                </Link>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.updates.title}
              </h2>
              <p className="leading-relaxed text-gray-300">{copy.sections.updates.body}</p>
            </section>
          </div>

          <div className="mt-12 border-t border-gray-700/50 pt-8 text-center">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/terms" className="text-blue-400 hover:underline">
                {copy.footerLinks.terms}
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/privacy" className="text-blue-400 hover:underline">
                {copy.footerLinks.privacy}
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/" className="text-blue-400 hover:underline">
                {copy.footerLinks.home}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
