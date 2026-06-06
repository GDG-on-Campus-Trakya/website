"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

const COPY = {
  tr: {
    title: "Kullanım Şartları",
    organization: "GDG on Campus Trakya Üniversitesi",
    updated: "Son Güncelleme: 2 Ekim 2025",
    sections: {
      acceptance: {
        title: "1. Kabul ve Onay",
        body:
          "Bu web sitesini kullanarak aşağıdaki kullanım şartlarını kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız platformu kullanmamanız gerekir. Güncel sürüm her zaman bu sayfada yayınlanır.",
      },
      services: {
        title: "2. Hizmet Tanımı",
        intro: "Platform temel olarak şu hizmetleri sunar:",
        items: [
          "Etkinlik duyuruları ve kayıt süreçleri",
          "Üye profil yönetimi",
          "Topluluk içeriği ve proje paylaşımı",
          "Sosyal medya ve topluluk etkileşimi",
          "Destek ve geri bildirim sistemi",
          "Etkinlik QR doğrulama akışları",
        ],
      },
      responsibilities: {
        title: "3. Kullanıcı Sorumlulukları",
        groups: [
          {
            title: "Hesap Güvenliği",
            items: [
              "Hesap bilgilerinizi güvenli tutmak",
              "Kimlik bilgilerinizi başkalarıyla paylaşmamak",
              "Şüpheli durumları bildirmek",
            ],
          },
          {
            title: "İçerik Sorumluluğu",
            items: [
              "Doğru bilgi paylaşmak",
              "Taciz, hakaret ve zararlı içerikten kaçınmak",
              "Telif hakkı ihlali yapmamak",
              "Spam veya kötü amaçlı içerik yüklememek",
            ],
          },
          {
            title: "Topluluk Kuralları",
            items: [
              "Diğer kullanıcılara saygılı davranmak",
              "Yapıcı ve öğretici katkılar sunmak",
              "Topluluk amacına uygun içerik üretmek",
              "Akademik ve etik kurallara uymak",
            ],
          },
        ],
      },
      prohibited: {
        title: "4. Yasaklanan Davranışlar",
        intro: "Aşağıdaki davranışlar kesin olarak yasaktır:",
        items: [
          "Sisteme zarar verme veya yetkisiz erişim girişimleri",
          "Başka kullanıcıların hesaplarına erişmeye çalışmak",
          "Kişisel verileri kötüye kullanmak",
          "Platformu ticari istismar amacıyla kullanmak",
          "Sahte hesap oluşturmak",
          "Sistem kaynaklarını aşırı veya kötü niyetli şekilde tüketmek",
          "Etkinlik kayıt veya QR süreçlerini manipüle etmeye çalışmak",
        ],
      },
      intellectualProperty: {
        title: "5. Fikri Mülkiyet Hakları",
        openSourceTitle: "Açık Kaynak Yapısı",
        openSourceBody:
          "Platform açık kaynak yaklaşımıyla geliştirilmektedir. Kaynak kodu erişilebilir olabilir, ancak Google ve GDG markaları ilgili hak sahiplerine aittir.",
        userContentTitle: "Kullanıcı İçerikleri",
        userContentItems: [
          "Paylaştığınız içerik üzerindeki haklar size aittir",
          "Platform üzerinde görüntüleme için gerekli kullanım iznini vermiş olursunuz",
          "Telif hakkı ihlallerinden içeriği paylaşan kullanıcı sorumludur",
        ],
      },
      continuity: {
        title: "6. Hizmet Sürekliliği",
        intro:
          "Bu platform öğrenci topluluğu tarafından yürütülmektedir. Bu nedenle aşağıdaki noktalar geçerlidir:",
        items: [
          "Kesintisiz hizmet garantisi verilmez",
          "Planlı bakım ve güncellemeler yapılabilir",
          "Teknik sorunlar veya geçici erişim problemleri yaşanabilir",
          "Bazı özellikler zaman içinde değiştirilebilir veya kaldırılabilir",
        ],
      },
      backup: {
        title: "7. Veri Yedekleme ve Kayıp",
        intro:
          "Verileri korumaya çalışsak da kullanıcıların önemli içerikler için kendi yedeklerini tutması önerilir.",
        items: [
          "Önemli dosyalarınızı başka yerlerde de saklayın",
          "Üçüncü taraf altyapılarda yaşanan arızalar platformu etkileyebilir",
          "Teknik sorunlar veri erişiminde geçici aksamalara yol açabilir",
        ],
      },
      eventRules: {
        title: "8. Etkinlik Katılım Kuralları",
        groups: [
          {
            title: "Kayıt Süreçleri",
            items: [
              "Etkinlik koşullarına uygun kullanıcılar katılabilir",
              "Doğru akademik ve profil bilgileri beklenir",
              "Bazı kayıtlar organizasyon ekibi onayına bağlı olabilir",
              "Katılım QR veya benzeri doğrulama akışlarıyla teyit edilebilir",
            ],
          },
          {
            title: "Etkinlik Davranışı",
            items: [
              "Etkinlik kurallarına ve zaman planına uyulmalıdır",
              "Diğer katılımcılara saygılı davranılmalıdır",
              "Organizasyon talimatları dikkate alınmalıdır",
              "Etkinliklerde fotoğraf veya video kaydı alınabilir",
            ],
          },
        ],
      },
      liability: {
        title: "9. Sorumluluk Sınırlamaları",
        intro: "Aşağıdaki durumlarda topluluk sınırlı sorumluluk yaklaşımı uygular:",
        items: [
          "Kullanıcı hatalarından doğan kayıplar",
          "Üçüncü taraf altyapı hizmetlerinden kaynaklanan sorunlar",
          "İnternet bağlantısı veya cihaz kaynaklı problemler",
          "Kullanıcılar arası anlaşmazlıklar",
          "Dış etkenlere bağlı hizmet kesintileri",
        ],
      },
      suspension: {
        title: "10. Hesap Askıya Alma ve Sonlandırma",
        groups: [
          {
            title: "Askıya Alma Sebepleri",
            items: [
              "Kullanım şartlarının ihlali",
              "Diğer kullanıcıları rahatsız eden davranışlar",
              "Teknik sisteme zarar verme girişimleri",
              "Sahte veya yanıltıcı bilgi paylaşımı",
            ],
          },
          {
            title: "Süreç",
            items: [
              "Uygun durumlarda önce uyarı verilebilir",
              "Gerekirse geçici askıya alma uygulanabilir",
              "Ciddi ihlallerde kalıcı işlem yapılabilir",
              "Bazı kararlar yeniden değerlendirilebilir",
            ],
          },
        ],
      },
      support: {
        title: "11. İletişim ve Destek",
        items: [
          ["Destek sistemi", "Platform içindeki bilet sistemi"],
          ["Konular", "Şikayet, öneri ve teknik destek"],
          ["Yanıt hedefi", "Genellikle 3-5 iş günü"],
          ["Katkı", "Topluluk kanalları ve açık kaynak katkıları"],
        ],
      },
      cookies: {
        title: "12. Çerez Kullanımı ve Veri İşleme",
        cardTitle: "Depolama ve Analitik",
        cardBody:
          "Platform, oturum yönetimi ve tercih saklama gibi gerekli işlevler için tarayıcı depolama mekanizmaları kullanabilir. Analitik davranışları ve tercihlerle ilgili ayrıntılar çerez politikası sayfasında açıklanır.",
        extraTitle: "Veri Güvenliği",
        extraItems: [
          "Kişisel veriler mümkün olduğunca sınırlı kapsamda işlenir",
          "Veriler reklam amaçlı üçüncü taraf paylaşımına konu edilmez",
          "Uygun alanlarda silme ve güncelleme talepleri desteklenir",
          "Veri işleme akışları politika belgelerinde açıklanır",
        ],
      },
      compliance: {
        title: "13. Yasal Uygunluk",
        items: [
          "Türkiye Cumhuriyeti hukuku dikkate alınır",
          "KVKK ve ilgili veri koruma yükümlülükleri gözetilir",
          "Üniversite ve topluluk kurallarıyla uyum hedeflenir",
          "Etik ve topluluk güvenliği ilkeleri esas alınır",
        ],
      },
      updates: {
        title: "14. Değişiklik ve Güncellemeler",
        items: [
          "Önemli değişiklikler duyurulabilir",
          "Güncel sürüm her zaman bu sayfada tutulur",
          "Platformu kullanmaya devam etmek güncel şartları kabul ettiğiniz anlamına gelir",
          "Açık kaynak geçmişi üzerinden değişimler takip edilebilir",
        ],
      },
    },
    closingTitle: "Eğitim Amaçlı Platform",
    closingBody:
      "Bu platform öğrenci topluluğu faaliyetleri ve teknoloji öğrenimini desteklemek amacıyla hazırlanmıştır. Hedef, öğrencileri bir araya getirmek ve güvenli bir topluluk alanı sunmaktır.",
    closingEmphasis: "Açık kaynak, şeffaf ve topluluk odaklı.",
  },
  en: {
    title: "Terms of Use",
    organization: "GDG on Campus Trakya University",
    updated: "Last Updated: October 2, 2025",
    sections: {
      acceptance: {
        title: "1. Acceptance",
        body:
          "By using this website, you agree to the terms below. If you do not agree with them, you should not use the platform. The latest version is always published on this page.",
      },
      services: {
        title: "2. Service Description",
        intro: "The platform primarily provides the following services:",
        items: [
          "Event announcements and registration flows",
          "Member profile management",
          "Community content and project sharing",
          "Social and community interaction features",
          "Support and feedback workflows",
          "Event QR verification flows",
        ],
      },
      responsibilities: {
        title: "3. User Responsibilities",
        groups: [
          {
            title: "Account Security",
            items: [
              "Keep your account information secure",
              "Do not share credentials with others",
              "Report suspicious activity",
            ],
          },
          {
            title: "Content Responsibility",
            items: [
              "Share accurate information",
              "Avoid harassment, abuse, or harmful content",
              "Do not infringe copyrights",
              "Do not upload spam or malicious content",
            ],
          },
          {
            title: "Community Rules",
            items: [
              "Treat other users respectfully",
              "Contribute constructively",
              "Create content aligned with the community purpose",
              "Follow academic and ethical expectations",
            ],
          },
        ],
      },
      prohibited: {
        title: "4. Prohibited Conduct",
        intro: "The following behavior is strictly prohibited:",
        items: [
          "Attempts to damage the system or gain unauthorized access",
          "Trying to access other users' accounts",
          "Misusing personal data",
          "Using the platform for commercial abuse",
          "Creating fake accounts",
          "Excessive or abusive consumption of system resources",
          "Attempting to manipulate registration or QR workflows",
        ],
      },
      intellectualProperty: {
        title: "5. Intellectual Property",
        openSourceTitle: "Open-Source Structure",
        openSourceBody:
          "The platform is built with an open-source approach. The source code may be accessible, but Google and GDG marks remain the property of their respective owners.",
        userContentTitle: "User Content",
        userContentItems: [
          "You keep the rights to the content you share",
          "You grant the platform the permissions needed to display that content",
          "The user who shares content is responsible for copyright violations",
        ],
      },
      continuity: {
        title: "6. Service Availability",
        intro:
          "This platform is operated by a student community. Because of that, the following conditions apply:",
        items: [
          "Continuous availability is not guaranteed",
          "Planned maintenance and updates may occur",
          "Technical issues or temporary access problems may happen",
          "Features may change or be removed over time",
        ],
      },
      backup: {
        title: "7. Data Backup and Loss",
        intro:
          "We try to protect data, but users should keep their own copies of any important content.",
        items: [
          "Store important files elsewhere as well",
          "Problems in third-party infrastructure may affect the platform",
          "Technical issues may temporarily impact data access",
        ],
      },
      eventRules: {
        title: "8. Event Participation Rules",
        groups: [
          {
            title: "Registration",
            items: [
              "Only users who meet the event conditions may participate",
              "Accurate profile and academic information is expected",
              "Some registrations may require organizer approval",
              "Attendance may be confirmed through QR or similar checks",
            ],
          },
          {
            title: "Behavior at Events",
            items: [
              "Follow event rules and schedules",
              "Respect other participants",
              "Follow organizer instructions",
              "Photo or video recordings may be taken during events",
            ],
          },
        ],
      },
      liability: {
        title: "9. Limitation of Liability",
        intro: "The community applies a limited-liability approach in cases such as:",
        items: [
          "Losses caused by user error",
          "Issues originating from third-party infrastructure services",
          "Internet or device-related problems",
          "Disputes between users",
          "Service interruptions caused by external factors",
        ],
      },
      suspension: {
        title: "10. Suspension and Termination",
        groups: [
          {
            title: "Reasons for Suspension",
            items: [
              "Violating these terms",
              "Behavior that disturbs other users",
              "Attempts to damage technical systems",
              "Sharing false or misleading information",
            ],
          },
          {
            title: "Process",
            items: [
              "A warning may be issued when appropriate",
              "Temporary suspension may be applied if needed",
              "Serious violations may lead to permanent action",
              "Some decisions may be reviewed again",
            ],
          },
        ],
      },
      support: {
        title: "11. Contact and Support",
        items: [
          ["Support system", "The built-in ticketing system"],
          ["Topics", "Complaints, suggestions, and technical support"],
          ["Response target", "Usually 3 to 5 business days"],
          ["Contribution", "Community channels and open-source contributions"],
        ],
      },
      cookies: {
        title: "12. Cookies and Data Processing",
        cardTitle: "Storage and Analytics",
        cardBody:
          "The platform may use browser storage for necessary functions such as session management and preference storage. Details about analytics and preferences are described on the cookie policy page.",
        extraTitle: "Data Security",
        extraItems: [
          "Personal data is processed with the narrowest practical scope",
          "Data is not shared with third parties for advertising",
          "Deletion and update requests are supported where appropriate",
          "Processing flows are documented in policy pages",
        ],
      },
      compliance: {
        title: "13. Legal Compliance",
        items: [
          "Turkish law is taken into account",
          "Data-protection obligations such as KVKK are considered",
          "University and community rules are respected",
          "Ethics and community safety principles apply",
        ],
      },
      updates: {
        title: "14. Changes and Updates",
        items: [
          "Material changes may be announced",
          "The current version is always kept on this page",
          "Continuing to use the platform means accepting the latest terms",
          "Changes can also be followed through the open-source history",
        ],
      },
    },
    closingTitle: "Education-Focused Platform",
    closingBody:
      "This platform exists to support student community activity and technology learning. The goal is to bring students together and provide a safe community space.",
    closingEmphasis: "Open-source, transparent, and community-focused.",
  },
};

export default function TermsOfService() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
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
                {copy.sections.acceptance.title}
              </h2>
              <p className="leading-relaxed text-gray-300">{copy.sections.acceptance.body}</p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.services.title}
              </h2>
              <p className="mb-4 text-gray-300">{copy.sections.services.intro}</p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                {copy.sections.services.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.responsibilities.title}
              </h2>
              <div className="space-y-6">
                {copy.sections.responsibilities.groups.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-3 text-lg font-semibold text-white">{group.title}</h3>
                    <ul className="ml-4 list-inside list-disc space-y-1 text-gray-300">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.prohibited.title}
              </h2>
              <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-6">
                <p className="mb-4 text-gray-300">{copy.sections.prohibited.intro}</p>
                <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                  {copy.sections.prohibited.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.intellectualProperty.title}
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-purple-500/30 bg-purple-900/20 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {copy.sections.intellectualProperty.openSourceTitle}
                  </h3>
                  <p className="leading-relaxed text-gray-300">
                    {copy.sections.intellectualProperty.openSourceBody}
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {copy.sections.intellectualProperty.userContentTitle}
                  </h3>
                  <ul className="ml-4 list-inside list-disc space-y-1 text-gray-300">
                    {copy.sections.intellectualProperty.userContentItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.continuity.title}
              </h2>
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-900/20 p-6">
                <p className="mb-4 leading-relaxed text-gray-300">
                  {copy.sections.continuity.intro}
                </p>
                <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                  {copy.sections.continuity.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.backup.title}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-300">{copy.sections.backup.intro}</p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                {copy.sections.backup.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.eventRules.title}
              </h2>
              <div className="space-y-4">
                {copy.sections.eventRules.groups.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-3 text-lg font-semibold text-white">{group.title}</h3>
                    <ul className="ml-4 list-inside list-disc space-y-1 text-gray-300">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.liability.title}
              </h2>
              <div className="rounded-xl border border-gray-600/50 bg-gray-700/30 p-6">
                <p className="mb-4 text-gray-300">{copy.sections.liability.intro}</p>
                <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                  {copy.sections.liability.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.suspension.title}
              </h2>
              <div className="space-y-4">
                {copy.sections.suspension.groups.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-3 text-lg font-semibold text-white">{group.title}</h3>
                    <ul className="ml-4 list-inside list-disc space-y-1 text-gray-300">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.support.title}
              </h2>
              <div className="rounded-xl border border-gray-600/50 bg-gray-700/30 p-6">
                <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                  {copy.sections.support.items.map(([label, value]) => (
                    <li key={label}>
                      <strong className="text-white">{label}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.cookies.title}
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-orange-500/30 bg-orange-900/20 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {copy.sections.cookies.cardTitle}
                  </h3>
                  <p className="leading-relaxed text-gray-300">
                    {copy.sections.cookies.cardBody}
                  </p>
                  <p className="mt-4 text-gray-300">
                    <Link href="/cookie-policy" className="font-semibold text-blue-400 hover:underline">
                      /cookie-policy
                    </Link>
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-white">
                    {copy.sections.cookies.extraTitle}
                  </h3>
                  <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                    {copy.sections.cookies.extraItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.compliance.title}
              </h2>
              <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                {copy.sections.compliance.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-blue-400">
                {copy.sections.updates.title}
              </h2>
              <div className="rounded-xl border border-blue-500/30 bg-blue-900/20 p-6">
                <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300">
                  {copy.sections.updates.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <div className="mt-12 border-t border-gray-700/50 pt-8 text-center">
              <div className="rounded-xl border border-green-500/30 bg-green-900/20 p-6">
                <p className="mb-2 font-semibold text-green-300">{copy.closingTitle}</p>
                <p className="text-sm leading-relaxed text-gray-300">
                  {copy.closingBody}
                  <br />
                  <strong className="text-white">{copy.closingEmphasis}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
