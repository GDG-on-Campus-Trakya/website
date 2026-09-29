import { buildMetadata } from '@/lib/seo';

// Title is the page part only; the root layout template appends " | GDG on Campus Trakya".
// Kept out of i18n/messages so it is not shipped to the client with every page.
const PAGE_META = {
  home: {
    path: '/',
    absoluteTitle: true,
    tr: {
      title: 'GDG on Campus Trakya Üniversitesi | Google Developer Groups Edirne',
      description:
        "Trakya Üniversitesi'nin Google Developer Groups topluluğu GDG on Campus Trakya: teknoloji etkinlikleri, hackathonlar, workshoplar ve yazılım eğitimleri."
    },
    en: {
      title: 'GDG on Campus Trakya University | Google Developer Groups Edirne',
      description:
        'GDG on Campus Trakya is the Google Developer Groups community at Trakya University: tech events, hackathons, workshops and software learning programs.'
    }
  },
  about: {
    path: '/about',
    tr: {
      title: 'Hakkımızda ve Ekibimiz',
      description:
        "GDG on Campus Trakya Üniversitesi ekibiyle tanışın. Trakya Üniversitesi'nde Google teknolojilerini öğrenen ve paylaşan geliştirici topluluğumuzu keşfedin."
    },
    en: {
      title: 'About Us and Our Team',
      description:
        'Meet the GDG on Campus Trakya University team, a community of student developers learning and sharing Google technologies at Trakya University.'
    }
  },
  events: {
    path: '/events',
    tr: {
      title: 'Etkinlikler: Workshop, Hackathon ve Eğitimler',
      description:
        "GDG on Campus Trakya'nın yaklaşan ve geçmiş etkinlikleri. Trakya Üniversitesi'nde workshop, hackathon, seminer ve eğitimlere kolayca kaydolun."
    },
    en: {
      title: 'Events: Workshops, Hackathons and Talks',
      description:
        'Upcoming and past GDG on Campus Trakya events. Register for workshops, hackathons, seminars and training sessions at Trakya University.'
    }
  },
  faq: {
    path: '/faq',
    tr: {
      title: 'Sıkça Sorulan Sorular',
      description:
        'GDG on Campus Trakya hakkında sık sorulan sorular: topluluğa kimler katılabilir, etkinliklere nasıl kayıt olunur, hesap ve profil işlemleri.'
    },
    en: {
      title: 'Frequently Asked Questions',
      description:
        'Answers to common questions about GDG on Campus Trakya: who can join, how to register for events, and how accounts and profiles work.'
    }
  },
  projects: {
    path: '/projects',
    tr: {
      title: 'Topluluk Projeleri',
      description:
        'GDG on Campus Trakya üyelerinin geliştirdiği açık kaynak ve topluluk projeleri. Projeleri inceleyin, beğenin ve katkıda bulunun.'
    },
    en: {
      title: 'Community Projects',
      description:
        'Open source and community projects built by GDG on Campus Trakya members. Browse, like and contribute to them.'
    }
  },
  announcements: {
    path: '/announcements',
    tr: {
      title: 'Duyurular',
      description:
        'GDG on Campus Trakya topluluğunun son duyuruları: yeni etkinlikler, başvurular, çekilişler ve topluluk haberleri.'
    },
    en: {
      title: 'Announcements',
      description:
        'Latest news from GDG on Campus Trakya: new events, applications, raffles and community updates.'
    }
  },
  social: {
    path: '/social',
    tr: {
      title: 'Sosyal: Etkinlik Anları ve Çekilişler',
      description:
        'GDG on Campus Trakya etkinliklerinden anıları paylaşın ve çekilişlere katılın.'
    },
    en: {
      title: 'Social: Event Moments and Raffles',
      description:
        'Share moments from GDG on Campus Trakya events and join raffles.'
    }
  },
  typingTest: {
    path: '/typing-test',
    tr: {
      title: 'Yazma Hızı Testi',
      description:
        'Klavye yazma hızını ve doğruluğunu ücretsiz ölç. Dakikadaki kelime sayını (WPM) öğren ve kendini geliştir.'
    },
    en: {
      title: 'Typing Speed Test',
      description:
        'Measure your typing speed and accuracy for free. Find your words per minute (WPM) and improve it.'
    }
  },
  privacy: {
    path: '/privacy',
    tr: {
      title: 'Gizlilik Politikası',
      description:
        'GDG on Campus Trakya web sitesinde kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi.'
    },
    en: {
      title: 'Privacy Policy',
      description:
        'How the GDG on Campus Trakya website collects, uses and protects your personal data.'
    }
  },
  terms: {
    path: '/terms',
    tr: {
      title: 'Kullanım Şartları',
      description:
        'GDG on Campus Trakya web sitesini ve etkinlik kayıt sistemini kullanırken geçerli olan şartlar ve koşullar.'
    },
    en: {
      title: 'Terms of Use',
      description:
        'The terms and conditions that apply when using the GDG on Campus Trakya website and event registration system.'
    }
  },
  cookiePolicy: {
    path: '/cookie-policy',
    tr: {
      title: 'Çerez Politikası',
      description:
        'GDG on Campus Trakya web sitesinde kullanılan çerezler, amaçları ve tercihlerinizi nasıl yönetebileceğiniz.'
    },
    en: {
      title: 'Cookie Policy',
      description:
        'The cookies used on the GDG on Campus Trakya website, what they are for and how to manage your preferences.'
    }
  }
};

/** generateMetadata result for a static public page. */
export function pageMetadata(key, locale, overrides = {}) {
  const entry = PAGE_META[key];
  const copy = entry[locale] || entry.tr;

  return buildMetadata({
    locale,
    path: entry.path,
    title: copy.title,
    description: copy.description,
    absoluteTitle: entry.absoluteTitle,
    ...overrides
  });
}
