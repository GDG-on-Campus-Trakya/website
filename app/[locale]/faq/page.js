"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Instagram, MessageSquare, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/ui/page";

const COPY = {
  tr: {
    title: "Sıkça Sorulan Sorular",
    description: "Platformumuz ve topluluğumuz hakkında merak ettiğiniz her şey",
    tipTitle: "İpucu:",
    tipBody:
      "Aradığınızı bulamazsanız, destek bilet sistemimizden soru sorabilirsiniz!",
    contactTitle: "Hala sorunuz mu var?",
    contactBody:
      "FAQ'da bulamadığınız sorular için destek sistemimizi kullanın veya sosyal medyadan ulaşın!",
    ticketCta: "Destek Bileti Oluştur",
    instagramCta: "Instagram'dan Ulaş",
    quickLinks: {
      about: "Hakkımızda",
      events: "Etkinlikler",
      privacy: "Gizlilik",
      terms: "Kullanım Şartları",
    },
    faqData: [
      {
        category: "Genel Sorular",
        questions: [
          {
            question: "GDG on Campus Trakya nedir?",
            answer:
              "GDG on Campus Trakya, Google Developer Groups programının Trakya Üniversitesi'ndeki resmi topluluğudur. Teknoloji meraklısı öğrencileri bir araya getirerek eğitim etkinlikleri, workshop'lar ve networking fırsatları sunuyoruz.",
          },
          {
            question: "Bu platform nasıl çalışıyor?",
            answer:
              "Platformumuz açık kaynak olarak geliştirildi. Firebase altyapısı ile güvenli veri saklama sağlıyor, Next.js ile modern bir web deneyimi sunuyoruz. Kaynak kodlarımızı GitHub üzerinden inceleyebilirsiniz.",
          },
          {
            question: "Kimler katılabilir?",
            answer:
              "Trakya Üniversitesi öğrencileri katılabilir. Kayıt sırasında fakülte ve bölüm bilgilerinizi doğru girmeniz gerekir. Tüm bölümlerden öğrenciler topluluğumuza katılabilir.",
          },
        ],
      },
      {
        category: "Hesap ve Profil",
        questions: [
          {
            question: "Nasıl hesap oluşturabilirim?",
            answer:
              "Google hesabınızla giriş yaparak otomatik olarak hesap oluşturabilirsiniz. İlk girişte profil bilgilerinizi tamamlamanız gerekir.",
          },
          {
            question: "Profil bilgilerimi nasıl güncellerim?",
            answer:
              "Profil sayfanızdaki düzenleme alanlarından ad, fakülte, bölüm ve profil fotoğrafı bilgilerinizi güncelleyebilirsiniz.",
          },
          {
            question: "Hesabımı silebilir miyim?",
            answer:
              "Evet. Profil sayfanızdaki hesap silme alanını kullanabilir veya destek bileti açabilirsiniz. Bu işlem verilerinizi kalıcı olarak kaldırır.",
          },
          {
            question: "Verilerim güvende mi?",
            answer:
              "Evet. Verileriniz Firebase güvenlik kuralları ve HTTPS şifreleme ile korunur. Ayrıntılar için gizlilik politikamızı inceleyebilirsiniz.",
          },
        ],
      },
      {
        category: "Etkinlikler",
        questions: [
          {
            question: "Etkinliklere nasıl kayıt olurum?",
            answer:
              "Etkinlikler sayfasından ilgilendiğiniz etkinliği açıp kayıt adımlarını tamamlayabilirsiniz. Bazı etkinliklerde profil bilgilerinizin eksiksiz olması gerekir.",
          },
          {
            question: "QR kod sistemi nasıl çalışıyor?",
            answer:
              "Kayıt sonrası profilinizde etkinliğe özel bir QR kod oluşur. Etkinlik günü organizasyon ekibine bu kodu göstererek katılımınızı doğrulatabilirsiniz.",
          },
          {
            question: "Kayıt iptal edebilir miyim?",
            answer:
              "Evet. Profilinizdeki kayıtlı etkinlikler alanından iptal işlemi yapabilirsiniz. Etkinlik tarihi yaklaştığında bazı kısıtlamalar uygulanabilir.",
          },
          {
            question: "Etkinlik doluysa ne yapmalıyım?",
            answer:
              "Bekleme listesi varsa katılabilir veya yeni etkinlik duyurularını takip edebilirsiniz. Sosyal medya hesaplarımızda da güncellemeler paylaşıyoruz.",
          },
        ],
      },
      {
        category: "Destek Sistemi",
        questions: [
          {
            question: "Nasıl destek alabilirim?",
            answer:
              "Destek sayfası üzerinden şikayet, öneri, teknik destek veya genel yardım başlıklarında bilet oluşturabilirsiniz. Gerekirse dosya da ekleyebilirsiniz.",
          },
          {
            question: "Destek biletlerimi nasıl takip ederim?",
            answer:
              "Tüm biletlerinizi destek sayfasında görebilir, yanıtları takip edebilir ve kapatılan biletleri gerekirse yeniden açabilirsiniz.",
          },
          {
            question: "Ne kadar sürede yanıt alırım?",
            answer:
              "Genellikle 3-5 iş günü içinde dönüş yapmayı hedefliyoruz. Daha hızlı temas gerekiyorsa sosyal medya hesaplarımızı da kullanabilirsiniz.",
          },
          {
            question: "Hangi dosya türlerini yükleyebilirim?",
            answer:
              "JPG, PNG, GIF, PDF ve TXT dosyalarını yükleyebilirsiniz. Maksimum dosya boyutu 5 MB, en fazla 3 dosya ekleyebilirsiniz.",
          },
        ],
      },
      {
        category: "Teknik Sorular",
        questions: [
          {
            question: "Site mobil uyumlu mu?",
            answer:
              "Evet. Arayüz telefon, tablet ve masaüstü cihazlarda uyumlu çalışacak şekilde tasarlanmıştır.",
          },
          {
            question: "Hangi teknolojiler kullanılıyor?",
            answer:
              "Next.js, React, Firebase, Tailwind CSS, Framer Motion ve Vercel gibi modern araçlar kullanıyoruz.",
          },
          {
            question: "Çerez kullanıyor musunuz?",
            answer:
              "Zorunlu olmayan çerezleri varsayılan olarak kullanmıyoruz. Analitik ve izin davranışları için ilgili politika sayfalarını inceleyebilirsiniz.",
          },
          {
            question: "Site ne kadar hızlı?",
            answer:
              "Next.js optimizasyonları, görsel iyileştirmeleri ve dağıtım altyapısı sayesinde sayfalar hızlı yüklenir.",
          },
          {
            question: "Kaynak kodlara nasıl erişebilirim?",
            answer:
              "Proje açık kaynak yaklaşımıyla geliştiriliyor. İlgili depolar ve güncellemeler topluluk kanallarımız üzerinden takip edilebilir.",
          },
        ],
      },
      {
        category: "Gizlilik ve Güvenlik",
        questions: [
          {
            question: "Kişisel verilerim nasıl korunuyor?",
            answer:
              "Verileriniz güvenlik kuralları ve HTTPS şifreleme ile korunur. Gizlilik politikamız veri işleme detaylarını açıklar.",
          },
          {
            question: "Verilerimi kimlerle paylaşıyorsunuz?",
            answer:
              "Kişisel verilerinizi üçüncü taraflarla reklam amaçlı paylaşmıyoruz. Hizmetin çalışması için gereken sınırlı kullanım senaryoları politika belgelerinde açıklanır.",
          },
          {
            question: "Bir güvenlik sorunu olursa ne yapıyorsunuz?",
            answer:
              "Olası güvenlik sorunlarında etkiyi sınırlandırmak, gerekli incelemeleri yürütmek ve kullanıcıları bilgilendirmek için standart müdahale adımlarını uygularız.",
          },
        ],
      },
      {
        category: "İletişim",
        questions: [
          {
            question: "Size nasıl ulaşabilirim?",
            answer:
              "Öncelikli kanal site içindeki destek sistemidir. Ayrıca Instagram ve LinkedIn hesaplarımız üzerinden de bize ulaşabilirsiniz.",
          },
          {
            question: "Acil durumlar için iletişim var mı?",
            answer:
              "Etkinlik günü veya teknik bir aksaklık sırasında en hızlı kanal sosyal medya hesaplarımızdır. Gerektiğinde etkinlik özelinde ek iletişim kanalları açılır.",
          },
          {
            question: "Geri bildirimlerim değerlendiriliyor mu?",
            answer:
              "Evet. Topluluktan gelen geri bildirimler ürün ve etkinlik kararlarında doğrudan dikkate alınır.",
          },
        ],
      },
    ],
  },
  en: {
    title: "Frequently Asked Questions",
    description: "Everything you may want to know about our platform and community",
    tipTitle: "Tip:",
    tipBody:
      "If you cannot find what you need, you can ask through our support ticket system.",
    contactTitle: "Still have a question?",
    contactBody:
      "Use the support system or contact us on social media if your question is not covered here.",
    ticketCta: "Create Support Ticket",
    instagramCta: "Message Us on Instagram",
    quickLinks: {
      about: "About",
      events: "Events",
      privacy: "Privacy",
      terms: "Terms",
    },
    faqData: [
      {
        category: "General",
        questions: [
          {
            question: "What is GDG on Campus Trakya?",
            answer:
              "GDG on Campus Trakya is the official Trakya University community in the Google Developer Groups program. We bring together students interested in technology through events, workshops, and networking opportunities.",
          },
          {
            question: "How does this platform work?",
            answer:
              "The platform is built as an open-source project. We use Firebase for secure data storage and Next.js for a modern web experience. You can inspect the source code on GitHub.",
          },
          {
            question: "Who can join?",
            answer:
              "Students at Trakya University can join. During registration you should provide accurate faculty and department information. Students from all departments are welcome.",
          },
        ],
      },
      {
        category: "Account and Profile",
        questions: [
          {
            question: "How do I create an account?",
            answer:
              "You can create an account automatically by signing in with your Google account. On your first visit, you will be asked to complete your profile details.",
          },
          {
            question: "How do I update my profile information?",
            answer:
              "You can update your name, faculty, department, and profile photo from the profile editing area on your account page.",
          },
          {
            question: "Can I delete my account?",
            answer:
              "Yes. You can use the account deletion option on your profile page or open a support ticket. This permanently removes your data.",
          },
          {
            question: "Is my data secure?",
            answer:
              "Yes. Your data is protected with Firebase security rules and HTTPS encryption. You can review our privacy policy for more detail.",
          },
        ],
      },
      {
        category: "Events",
        questions: [
          {
            question: "How do I register for events?",
            answer:
              "Open the event you want from the events page and complete the registration flow. Some events require a complete user profile before registration.",
          },
          {
            question: "How does the QR code system work?",
            answer:
              "After registration, a unique QR code for that event is generated in your profile. You can show it to the organizing team on event day to confirm attendance.",
          },
          {
            question: "Can I cancel my registration?",
            answer:
              "Yes. You can cancel from the registered events section in your profile. Some restrictions may apply as the event date approaches.",
          },
          {
            question: "What if an event is full?",
            answer:
              "If a waiting list is available you can join it, or follow upcoming event announcements. We also share updates on social media.",
          },
        ],
      },
      {
        category: "Support System",
        questions: [
          {
            question: "How can I get support?",
            answer:
              "You can create tickets through the support page for complaints, suggestions, technical issues, or general help. You can also attach files when needed.",
          },
          {
            question: "How do I track my support tickets?",
            answer:
              "You can view all tickets on the support page, follow responses there, and reopen closed tickets when necessary.",
          },
          {
            question: "How long does it take to get a response?",
            answer:
              "We usually aim to respond within 3 to 5 business days. If faster contact is needed, you can also reach out on social media.",
          },
          {
            question: "What file types can I upload?",
            answer:
              "You can upload JPG, PNG, GIF, PDF, and TXT files. The maximum file size is 5 MB and you can attach up to 3 files.",
          },
        ],
      },
      {
        category: "Technical",
        questions: [
          {
            question: "Is the site mobile-friendly?",
            answer:
              "Yes. The interface is designed to work well across phones, tablets, and desktop devices.",
          },
          {
            question: "What technologies are used?",
            answer:
              "We use modern tools such as Next.js, React, Firebase, Tailwind CSS, Framer Motion, and Vercel.",
          },
          {
            question: "Do you use cookies?",
            answer:
              "We do not rely on non-essential cookies by default. For analytics and consent behavior, review the relevant policy pages.",
          },
          {
            question: "How fast is the site?",
            answer:
              "Pages load quickly thanks to Next.js optimizations, image handling, and the deployment infrastructure.",
          },
          {
            question: "How can I access the source code?",
            answer:
              "The project is built with an open-source mindset. Relevant repositories and updates can be followed through our community channels.",
          },
        ],
      },
      {
        category: "Privacy and Security",
        questions: [
          {
            question: "How is my personal data protected?",
            answer:
              "Your data is protected with security rules and HTTPS encryption. Our privacy policy explains the processing details.",
          },
          {
            question: "Who do you share my data with?",
            answer:
              "We do not share personal data with third parties for advertising. Limited service-related use cases are documented in our policy pages.",
          },
          {
            question: "What happens if there is a security issue?",
            answer:
              "If a security issue occurs, we follow a standard response process to limit impact, investigate the incident, and notify users when necessary.",
          },
        ],
      },
      {
        category: "Contact",
        questions: [
          {
            question: "How can I reach you?",
            answer:
              "The primary channel is the built-in support system. You can also reach us through our Instagram and LinkedIn accounts.",
          },
          {
            question: "Is there a contact option for urgent cases?",
            answer:
              "On event days or during technical issues, social media is usually the fastest channel. Additional communication channels may be opened for specific events when needed.",
          },
          {
            question: "Do you review feedback?",
            answer:
              "Yes. Feedback from the community directly informs product and event decisions.",
          },
        ],
      },
    ],
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
