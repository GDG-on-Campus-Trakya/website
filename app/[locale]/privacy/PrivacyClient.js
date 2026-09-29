"use client";

import { useLocale } from "next-intl";
import { PageContainer } from "@/components/ui/page";

const COPY = {
  tr: {
    title: "Gizlilik Politikası",
    organization: "GDG on Campus Trakya Üniversitesi",
    updated: "Son Güncelleme: 2 Ekim 2025",
    sections: {
      intro: {
        title: "1. Giriş",
        paragraphs: [
          "GDG on Campus Trakya Üniversitesi olarak kişisel verilerinizin korunmasına önem veriyoruz. Bu politika, hangi verileri topladığımızı, neden kullandığımızı ve nasıl koruduğumuzu açıklar.",
          "Platform açık kaynak yaklaşımıyla geliştirilmektedir. Bu sayede temel veri işleme davranışları topluluk tarafından da incelenebilir.",
        ],
      },
      collectedData: {
        title: "2. Toplanan Kişisel Veriler",
        groups: [
          {
            title: "Hesap Bilgileri",
            items: ["Ad ve soyad", "E-posta adresi", "Profil fotoğrafı (isteğe bağlı)"],
          },
          {
            title: "Akademik Bilgiler",
            items: ["Fakülte bilgisi", "Bölüm bilgisi"],
          },
          {
            title: "İletişim Verileri",
            items: [
              "Destek biletlerinde paylaşılan bilgiler",
              "Dosya ekleri (isteğe bağlı)",
            ],
          },
        ],
      },
      purposes: {
        title: "3. Verilerin Kullanım Amaçları",
        intro: "Topladığımız kişisel veriler aşağıdaki amaçlarla kullanılır:",
        items: [
          ["Etkinlik organizasyonu", "Etkinlik kayıtlarını ve katılım süreçlerini yönetmek"],
          ["İstatistiksel analiz", "Anonim fakülte ve bölüm dağılımlarını değerlendirmek"],
          ["Destek hizmetleri", "Teknik destek ve geri bildirim süreçlerini yürütmek"],
          ["İletişim", "Duyurular ve önemli bilgilendirmeleri iletmek"],
        ],
      },
      legalBasis: {
        title: "4. Hukuki Dayanak",
        body: "Kişisel veriler açık rıza, topluluk faaliyetlerinin yürütülmesi ve meşru menfaat kapsamındaki sınırlı operasyonel ihtiyaçlar doğrultusunda işlenir.",
      },
      retention: {
        title: "5. Veri Saklama Süresi",
        intro:
          "Veriler hizmetin çalışması ve topluluk operasyonları için gerekli olduğu sürece tutulur. Silme ve arşivleme davranışları şu şekilde özetlenebilir:",
        items: [
          ["Hesap bilgileri", "Hesap silme talebiyle kaldırılabilir"],
          ["Destek biletleri", "Operasyonel kayıt amacıyla saklanır, talep halinde değerlendirilir"],
          ["Etkinlik kayıtları", "Topluluk istatistikleri ve organizasyon kayıtları için tutulabilir"],
        ],
        note:
          'Not: Hesap silme işlemi için profil sayfanızdaki ilgili alanı kullanabilir veya destek sistemi üzerinden talep oluşturabilirsiniz.',
      },
      security: {
        title: "6. Veri Güvenliği",
        intro: "Verileri korumak için aşağıdaki önlemler uygulanır:",
        items: [
          "Erişim kontrolü ve yetkilendirme",
          "HTTPS üzerinden güvenli veri aktarımı",
          "Altyapı ve bağımlılık güncellemeleri",
          "Yetki kapsamının mümkün olduğunca dar tutulması",
        ],
      },
      rights: {
        title: "7. Haklar",
        intro: "KVKK kapsamındaki temel haklarınız şunlardır:",
        cards: [
          ["Erişim Hakkı", "Verilerinizin işlenip işlenmediğini öğrenme"],
          ["Düzeltme Hakkı", "Eksik veya yanlış verilerin düzeltilmesini isteme"],
          ["Silme Hakkı", "Uygun durumlarda verilerinizin silinmesini talep etme"],
          ["İtiraz Hakkı", "Belirli veri işleme süreçlerine itiraz etme"],
        ],
      },
      cookies: {
        title: "8. Çerez Kullanımı",
        body:
          "Platform zorunlu olmayan takip teknolojilerini varsayılan olarak sınırlı kullanır. Analitik ve saklama davranışlarıyla ilgili güncel detaylar çerez politikası sayfasında açıklanır.",
      },
      thirdParty: {
        title: "9. Üçüncü Taraf Hizmetler",
        cards: [
          ["Firebase", "Kimlik doğrulama, veri saklama ve ilgili altyapı hizmetleri"],
          ["Vercel Analytics", "Anonim performans ve kullanım istatistikleri"],
        ],
      },
      openSource: {
        title: "10. Açık Kaynak Yapısı",
        body:
          "Platform açık kaynak yaklaşımıyla geliştirildiği için uygulamanın davranışları daha şeffaf biçimde incelenebilir. Bu, veri işleme kararlarının topluluk tarafından denetlenmesine yardımcı olur.",
        emphasis: "Şeffaflık önceliklerimizden biridir.",
      },
      contact: {
        title: "11. İletişim",
        intro:
          "Gizlilik politikası veya veri koruma talepleriyle ilgili olarak aşağıdaki kanalları kullanabilirsiniz:",
        items: [
          ["Veri sorumlusu", "GDG on Campus Trakya Üniversitesi"],
          ["İletişim", "Site içindeki destek sistemi"],
          ["Bağlam", "Trakya Üniversitesi öğrenci topluluğu faaliyetleri"],
        ],
      },
      updates: {
        title: "12. Güncellemeler",
        body:
          "Bu politika gerektiğinde güncellenebilir. Önemli değişikliklerde kullanıcıları bilgilendirmeye çalışırız ve güncel sürüm her zaman bu sayfada yayınlanır.",
      },
    },
    footer:
      "Bu politika KVKK ve ilgili veri koruma yükümlülükleri dikkate alınarak hazırlanmıştır.",
  },
  en: {
    title: "Privacy Policy",
    organization: "GDG on Campus Trakya University",
    updated: "Last Updated: October 2, 2025",
    sections: {
      intro: {
        title: "1. Introduction",
        paragraphs: [
          "At GDG on Campus Trakya University, we take the protection of personal data seriously. This policy explains what data we collect, why we use it, and how we protect it.",
          "The platform is developed with an open-source mindset, which makes the core data-handling behavior more transparent to the community.",
        ],
      },
      collectedData: {
        title: "2. Personal Data We Collect",
        groups: [
          {
            title: "Account Information",
            items: ["Full name", "Email address", "Profile photo (optional)"],
          },
          {
            title: "Academic Information",
            items: ["Faculty", "Department"],
          },
          {
            title: "Communication Data",
            items: [
              "Information shared in support tickets",
              "File attachments (optional)",
            ],
          },
        ],
      },
      purposes: {
        title: "3. Why We Use Data",
        intro: "We use personal data for the following purposes:",
        items: [
          ["Event operations", "To manage registrations and attendance workflows"],
          ["Statistical analysis", "To evaluate anonymous faculty and department distribution"],
          ["Support services", "To handle technical support and feedback"],
          ["Communication", "To send announcements and important updates"],
        ],
      },
      legalBasis: {
        title: "4. Legal Basis",
        body: "Personal data is processed based on consent, limited operational needs related to community activities, and legitimate-interest scenarios where applicable.",
      },
      retention: {
        title: "5. Data Retention",
        intro:
          "Data is kept as long as needed for the service and community operations. In general, retention and deletion behave as follows:",
        items: [
          ["Account information", "Can be removed through an account deletion request"],
          ["Support tickets", "May be retained as operational records and reviewed upon request"],
          ["Event registrations", "May be kept for community statistics and organizational records"],
        ],
        note:
          "Note: You can request account deletion from the relevant area in your profile or through the support system.",
      },
      security: {
        title: "6. Data Security",
        intro: "We apply the following safeguards to protect data:",
        items: [
          "Access control and authorization",
          "Secure data transfer over HTTPS",
          "Infrastructure and dependency updates",
          "Keeping access scopes as narrow as possible",
        ],
      },
      rights: {
        title: "7. Your Rights",
        intro: "Your key rights under applicable data-protection rules include:",
        cards: [
          ["Right of access", "To learn whether your data is being processed"],
          ["Right to rectification", "To request correction of incomplete or inaccurate data"],
          ["Right to erasure", "To request deletion of your data where appropriate"],
          ["Right to object", "To object to certain processing activities"],
        ],
      },
      cookies: {
        title: "8. Cookies",
        body:
          "The platform keeps non-essential tracking limited by default. Current details about analytics and storage behavior are explained on the cookie policy page.",
      },
      thirdParty: {
        title: "9. Third-Party Services",
        cards: [
          ["Firebase", "Authentication, data storage, and related infrastructure services"],
          ["Vercel Analytics", "Anonymous usage and performance insights"],
        ],
      },
      openSource: {
        title: "10. Open-Source Structure",
        body:
          "Because the platform is developed with an open-source approach, its behavior can be reviewed more transparently. This helps the community inspect how data-related decisions are implemented.",
        emphasis: "Transparency is one of our priorities.",
      },
      contact: {
        title: "11. Contact",
        intro:
          "If you have questions about this policy or want to make a data-related request, you can use the following channels:",
        items: [
          ["Data controller", "GDG on Campus Trakya University"],
          ["Contact", "The built-in support system"],
          ["Context", "Student community activities at Trakya University"],
        ],
      },
      updates: {
        title: "12. Updates",
        body:
          "This policy may be updated when needed. We try to inform users about material changes, and the latest version is always published on this page.",
      },
    },
    footer:
      "This policy was prepared with reference to Turkish data-protection obligations and related privacy responsibilities.",
  },
};

const h2Class =
  "mt-12 border-t border-rule pt-6 font-display text-xl font-bold first:mt-0 first:border-t-0 first:pt-0";
const h3Class = "mt-6 font-display text-lg font-semibold";
const pClass = "mt-3 text-ink-2";
const listClass = "mt-3 list-disc space-y-1.5 pl-5 text-ink-2";

export default function PrivacyPolicy() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const { sections } = copy;

  return (
    <PageContainer>
      <header className="mb-10 border-b border-rule pb-6">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">{copy.title}</h1>
        <p className="mt-3 text-md text-ink-2">{copy.organization}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.updated}</p>
      </header>

      <div className="max-w-measure">
        <section>
          <h2 className={h2Class}>{sections.intro.title}</h2>
          {sections.intro.paragraphs.map((paragraph) => (
            <p key={paragraph} className={pClass}>
              {paragraph}
            </p>
          ))}
        </section>

        <section>
          <h2 className={h2Class}>{sections.collectedData.title}</h2>
          {sections.collectedData.groups.map((group) => (
            <div key={group.title}>
              <h3 className={h3Class}>{group.title}</h3>
              <ul className={listClass}>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section>
          <h2 className={h2Class}>{sections.purposes.title}</h2>
          <p className={pClass}>{sections.purposes.intro}</p>
          <ul className={listClass}>
            {sections.purposes.items.map(([label, description]) => (
              <li key={label}>
                <strong className="font-semibold text-ink">{label}:</strong> {description}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={h2Class}>{sections.legalBasis.title}</h2>
          <p className={pClass}>{sections.legalBasis.body}</p>
        </section>

        <section>
          <h2 className={h2Class}>{sections.retention.title}</h2>
          <p className={pClass}>{sections.retention.intro}</p>
          <ul className={listClass}>
            {sections.retention.items.map(([label, description]) => (
              <li key={label}>
                <strong className="font-semibold text-ink">{label}:</strong> {description}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded bg-warning px-4 py-3 text-sm text-ink">
            {sections.retention.note}
          </p>
        </section>

        <section>
          <h2 className={h2Class}>{sections.security.title}</h2>
          <p className={pClass}>{sections.security.intro}</p>
          <ul className={listClass}>
            {sections.security.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={h2Class}>{sections.rights.title}</h2>
          <p className={pClass}>{sections.rights.intro}</p>
          <dl className="mt-3 divide-y divide-rule border-y border-rule">
            {sections.rights.cards.map(([title, body]) => (
              <div key={title} className="py-3">
                <dt className="font-semibold text-ink">{title}</dt>
                <dd className="mt-1 text-ink-2">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className={h2Class}>{sections.cookies.title}</h2>
          <p className={pClass}>{sections.cookies.body}</p>
        </section>

        <section>
          <h2 className={h2Class}>{sections.thirdParty.title}</h2>
          <dl className="mt-3 divide-y divide-rule border-y border-rule">
            {sections.thirdParty.cards.map(([title, body]) => (
              <div key={title} className="py-3">
                <dt className="font-semibold text-ink">{title}</dt>
                <dd className="mt-1 text-ink-2">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className={h2Class}>{sections.openSource.title}</h2>
          <p className={pClass}>{sections.openSource.body}</p>
          <p className="mt-3 font-semibold text-ink">{sections.openSource.emphasis}</p>
        </section>

        <section>
          <h2 className={h2Class}>{sections.contact.title}</h2>
          <p className={pClass}>{sections.contact.intro}</p>
          <ul className={listClass}>
            {sections.contact.items.map(([label, value]) => (
              <li key={label}>
                <strong className="font-semibold text-ink">{label}:</strong> {value}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={h2Class}>{sections.updates.title}</h2>
          <p className={pClass}>{sections.updates.body}</p>
        </section>

        <p className="mt-12 border-t border-rule pt-4 text-sm text-muted-foreground">
          {copy.footer}
        </p>
      </div>
    </PageContainer>
  );
}
