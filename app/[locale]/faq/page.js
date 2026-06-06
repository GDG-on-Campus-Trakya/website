"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="container mx-auto px-4 pb-12 pt-20 sm:pt-24 md:pt-28">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] bg-clip-text text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl"
            >
              {copy.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-8 max-w-3xl text-xl text-gray-300 sm:text-2xl"
            >
              {copy.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-blue-500/30 bg-blue-900/20 p-6"
            >
              <p className="text-blue-200">
                <strong>{copy.tipTitle}</strong> {copy.tipBody}
              </p>
            </motion.div>
          </div>

          <div className="space-y-8">
            {copy.faqData.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="rounded-2xl border border-gray-700/50 bg-gray-800/30 p-6 backdrop-blur-md"
              >
                <h2 className="mb-6 border-b border-gray-700/50 pb-3 text-2xl font-bold text-white">
                  {category.category}
                </h2>

                <div className="space-y-4">
                  {category.questions.map((item, questionIndex) => {
                    const itemKey = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems[itemKey];

                    return (
                      <div
                        key={item.question}
                        className="overflow-hidden rounded-xl border border-gray-700/30"
                      >
                        <button
                          onClick={() => toggleItem(itemKey)}
                          className="flex w-full items-center justify-between bg-gray-700/20 px-6 py-4 text-left transition-all duration-200 hover:bg-gray-700/30"
                        >
                          <span className="pr-4 font-semibold text-white">
                            {item.question}
                          </span>
                          <motion.svg
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-5 w-5 flex-shrink-0 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </motion.svg>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-gray-700/30 bg-gray-800/20 px-6 py-4">
                                <p className="whitespace-pre-line leading-relaxed text-gray-300">
                                  {item.answer}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-8 text-center"
          >
            <h3 className="mb-4 text-2xl font-bold text-white">{copy.contactTitle}</h3>
            <p className="mb-6 text-gray-300">{copy.contactBody}</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/tickets")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {copy.ticketCta}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  window.open("https://www.instagram.com/gdgoncampustu/", "_blank")
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-700 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-pink-700 hover:to-purple-800 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                {copy.instagramCta}
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push("/about")}
              className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 transition-all duration-200 hover:border-blue-500/50"
            >
              <div className="mb-2 text-2xl">👥</div>
              <div className="text-sm text-gray-300">{copy.quickLinks.about}</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push("/events")}
              className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 transition-all duration-200 hover:border-green-500/50"
            >
              <div className="mb-2 text-2xl">📅</div>
              <div className="text-sm text-gray-300">{copy.quickLinks.events}</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push("/privacy")}
              className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 transition-all duration-200 hover:border-purple-500/50"
            >
              <div className="mb-2 text-2xl">🔒</div>
              <div className="text-sm text-gray-300">{copy.quickLinks.privacy}</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push("/terms")}
              className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 transition-all duration-200 hover:border-yellow-500/50"
            >
              <div className="mb-2 text-2xl">📋</div>
              <div className="text-sm text-gray-300">{copy.quickLinks.terms}</div>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
