// Shared by the FAQ page (UI) and its FAQPage JSON-LD. Every answer describes something the
// site actually does; check the feature before adding or changing one.
export const FAQ_DATA = {
  tr: [
    {
      category: "Genel",
      questions: [
        {
          question: "GDG on Campus Trakya nedir?",
          answer:
            "Google Developer Groups on Campus programının Trakya Üniversitesi'ndeki topluluğu. Öğrenciler yürütüyor; yazılım ve Google teknolojileri üzerine atölye, konuşma ve hackathon düzenliyoruz.",
        },
        {
          question: "Kimler katılabilir?",
          answer:
            "Trakya Üniversitesi'nin her bölümünden öğrenciler. Bir etkinliğe ilk kayıt olduğunda adını, fakülteni ve bölümünü bir kez soruyoruz.",
        },
      ],
    },
    {
      category: "Hesap ve profil",
      questions: [
        {
          question: "Nasıl hesap açarım?",
          answer:
            "Giriş sayfasından Google hesabınla ya da e-posta adresin ve bir şifreyle. E-postayla açarsan gelen bağlantıyla adresini doğrulaman gerekir.",
        },
        {
          question: "Profil bilgilerimi nasıl değiştiririm?",
          answer:
            "Profil sayfasından adını, fakülteni, bölümünü ve fotoğrafını değiştirebilirsin.",
        },
        {
          question: "Hesabımı silebilir miyim?",
          answer:
            "Evet. Profil sayfasındaki hesap silme bölümünden silebilirsin; verilerin kalıcı olarak kaldırılır. Takılırsan destek talebi aç.",
        },
      ],
    },
    {
      category: "Etkinlikler",
      questions: [
        {
          question: "Etkinliğe nasıl kayıt olurum?",
          answer:
            "Etkinlikler sayfasında etkinliği aç ve Kayıt ol'a bas. Giriş yapman gerekir; fakülte ya da bölüm bilgin eksikse kayıt sırasında sorulur.",
        },
        {
          question: "QR bilet ne işe yarıyor?",
          answer:
            "Kayıt olunca profiline o etkinliğe özel bir QR kod düşer. Girişte ekibe gösterirsin; okutulunca katılımın kaydedilir.",
        },
        {
          question: "Kaydımı iptal edebilir miyim?",
          answer: "Evet. Profilindeki kayıtlı etkinlikler listesinden kaydını silebilirsin.",
        },
      ],
    },
    {
      category: "Destek",
      questions: [
        {
          question: "Nasıl destek alırım?",
          answer:
            "Destek sayfasından talep aç: şikâyet, öneri, teknik sorun ya da genel bir soru olabilir. İstersen dosya da ekleyebilirsin.",
        },
        {
          question: "Taleplerimi nasıl takip ederim?",
          answer:
            "Açtığın talepler destek sayfasında listelenir. Yanıtları orada görürsün; kapanan bir talebi gerekirse yeniden açabilirsin.",
        },
        {
          question: "Ne kadar sürede yanıt alırım?",
          answer:
            "Genellikle 3–5 iş günü içinde dönüyoruz. Daha acilse Instagram'dan yaz.",
        },
        {
          question: "Talebime hangi dosyaları ekleyebilirim?",
          answer: "JPG, PNG, GIF, PDF ve TXT. En fazla 3 dosya, her biri en fazla 5 MB.",
        },
        {
          question: "Size başka nasıl ulaşırım?",
          answer: "Instagram ve LinkedIn hesaplarımızdan da yazabilirsin; bağlantılar sayfanın altında.",
        },
      ],
    },
    {
      category: "Site ve gizlilik",
      questions: [
        {
          question: "Sitenin kaynak kodu açık mı?",
          answer:
            "Evet, GitHub'da: github.com/GDG-on-Campus-Trakya/website. Bir hata bulursan orada issue açabilir ya da katkı verebilirsin.",
        },
        {
          question: "Çerez kullanıyor musunuz?",
          answer:
            "Giriş ve temel işlevler için gerekli olanları kullanıyoruz. Ziyaret istatistikleri (Vercel Analytics) yalnızca izin verirsen açılır; tercihini sayfanın altındaki Çerez tercihleri bağlantısından değiştirebilirsin.",
        },
        {
          question: "Verilerim nasıl korunuyor?",
          answer:
            "Hesap ve kayıt verilerin Firebase'de tutulur; kimin neyi okuyabileceğini güvenlik kuralları sınırlar ve bağlantı HTTPS ile şifrelenir. Ayrıntılar gizlilik politikasında.",
        },
        {
          question: "Verilerimi kimlerle paylaşıyorsunuz?",
          answer:
            "Reklam ya da pazarlama için kimseyle paylaşmıyoruz. Sitenin çalışması için kullanılan hizmetler (Firebase, Vercel Analytics) gizlilik politikasında listelenir.",
        },
      ],
    },
  ],
  en: [
    {
      category: "General",
      questions: [
        {
          question: "What is GDG on Campus Trakya?",
          answer:
            "The Google Developer Groups on Campus community at Trakya University. It is run by students; we hold workshops, talks and hackathons on software and Google technologies.",
        },
        {
          question: "Who can join?",
          answer:
            "Students from any department at Trakya University. The first time you register for an event we ask once for your name, faculty and department.",
        },
      ],
    },
    {
      category: "Account and profile",
      questions: [
        {
          question: "How do I create an account?",
          answer:
            "On the sign-in page, with your Google account or with your e-mail address and a password. If you use e-mail, confirm your address with the link we send you.",
        },
        {
          question: "How do I change my profile details?",
          answer: "On your profile page you can change your name, faculty, department and photo.",
        },
        {
          question: "Can I delete my account?",
          answer:
            "Yes. Use the account deletion section on your profile page; your data is removed permanently. If you get stuck, open a support request.",
        },
      ],
    },
    {
      category: "Events",
      questions: [
        {
          question: "How do I register for an event?",
          answer:
            "Open the event on the events page and press Register. You need to be signed in; if your faculty or department is missing, you are asked for it while registering.",
        },
        {
          question: "What is the QR ticket for?",
          answer:
            "When you register, a QR code for that event appears on your profile. Show it to the team at the door; scanning it records your attendance.",
        },
        {
          question: "Can I cancel my registration?",
          answer: "Yes. Remove it from the list of registered events on your profile.",
        },
      ],
    },
    {
      category: "Support",
      questions: [
        {
          question: "How do I get support?",
          answer:
            "Open a request on the support page: a complaint, a suggestion, a technical problem or a general question. You can attach files too.",
        },
        {
          question: "How do I follow my requests?",
          answer:
            "Your requests are listed on the support page. Replies appear there, and you can reopen a closed request if you need to.",
        },
        {
          question: "How soon will I get a reply?",
          answer:
            "Usually within 3–5 working days. If it is urgent, message us on Instagram.",
        },
        {
          question: "Which files can I attach to a request?",
          answer: "JPG, PNG, GIF, PDF and TXT. Up to 3 files, each up to 5 MB.",
        },
        {
          question: "How else can I reach you?",
          answer: "You can also write to us on Instagram and LinkedIn; the links are at the bottom of the page.",
        },
      ],
    },
    {
      category: "Site and privacy",
      questions: [
        {
          question: "Is the site open source?",
          answer:
            "Yes, it is on GitHub: github.com/GDG-on-Campus-Trakya/website. If you find a bug you can open an issue there or contribute.",
        },
        {
          question: "Do you use cookies?",
          answer:
            "Only the ones needed for signing in and basic features. Visit statistics (Vercel Analytics) are switched on only if you allow them; change your choice with the Cookie preferences link at the bottom of the page.",
        },
        {
          question: "How is my data protected?",
          answer:
            "Your account and registration data is stored in Firebase; security rules limit who can read what, and connections are encrypted with HTTPS. The privacy policy has the details.",
        },
        {
          question: "Who do you share my data with?",
          answer:
            "No one, for advertising or marketing. The services the site needs to run (Firebase, Vercel Analytics) are listed in the privacy policy.",
        },
      ],
    },
  ],
};
